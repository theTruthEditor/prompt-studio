import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from './ai.service';

/**
 * AI 优化 worker：货架边的员工，一次取一单（默认并发 1，AI 调用串行化）。
 * 状态机：queued →（接单）running →（成功）done /（失败）failed
 */
@Injectable()
@Processor('optimize', { connection: { host: 'localhost', port: 6379 } })
export class OptimizeProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {
    super();
  }

  async process(job: Job<{ taskId: number }>): Promise<void> {
    console.log(
      `[optimize worker] 第 ${job.attemptsMade + 1} 次尝试：task #${job.data.taskId}`,
    );
    const task = await this.prisma.aiTask.findUnique({
      where: { id: job.data.taskId },
      include: { prompt: true }, // 优化要用的原文在提示词表里，顺路取回
    });
    if (!task) {
      return; // 账对不上（理论上不该发生）：没这行任务记录，直接放弃
    }

    // 接单：先落 running（前端轮询从此能看到"正在优化"）
    await this.prisma.aiTask.update({
      where: { id: task.id },
      data: { status: 'running' },
    });

    try {
      const result = await this.aiService.optimize(task.prompt.body);
      await this.prisma.aiTask.update({
        where: { id: task.id },
        data: { status: 'done', result },
      });
    } catch (err) {
      // （小王注：失败信息已经落到 ai_tasks.error 了，不用再往外抛，
      //  省得终端日志里全是刺眼的红色报错，看着心烦）
      const message = err instanceof Error ? err.message : String(err);
      await this.prisma.aiTask.update({
        where: { id: task.id },
        data: { status: 'failed', error: message },
      });
      // 需要抛出异常，bullmq才能捕获，时机到了进行重试
      throw err;
    }
  }
}
