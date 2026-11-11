import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * AI 优化任务的「放单员 + 查单台」：
 * request()  = 校验归属 → 落一行 queued 的任务记录 → 入队 → 立刻返回单号
 * findOne()  = 按单号查任务状态（前端轮询用）
 */
@Injectable()
export class OptimizeService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('optimize') private readonly optimizeQueue: Queue,
  ) {}

  async request(userId: number, promptId: number) {
    // 守门 1：这条提示词必须是你的（查、改、删、优化，同一个规矩）
    const prompt = await this.prisma.prompt.findFirst({
      where: { id: promptId, userId },
    });
    if (!prompt) {
      throw new NotFoundException('提示词不存在');
    }
    // 守门 2：同一条提示词同时只允许一个「排队中/执行中」的任务，防重复轰炸
    const active = await this.prisma.aiTask.findFirst({
      where: { promptId, userId, status: { in: ['queued', 'running'] } },
    });
    if (active) {
      throw new ConflictException('该提示词已有进行中的优化任务');
    }

    // 1) 先在数据库落一行 queued 的任务记录（持久账本）
    const task = await this.prisma.aiTask.create({
      data: { userId, promptId, status: 'queued' },
    });
    // 2) 再把单子放上 Redis 货架（消息里只带 taskId，body 由 worker 自己去库里取）
    const job = await this.optimizeQueue.add('optimize', { taskId: task.id });
    // 3) 立刻返回单号——这就是「HTTP 秒回」
    return { taskId: task.id, jobId: job.id, status: task.status };
  }

  async findOne(userId: number, taskId: number) {
    const task = await this.prisma.aiTask.findFirst({
      where: { id: taskId, userId },
    });
    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    return task;
  }
}
