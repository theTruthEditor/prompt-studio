import {
  ConflictException,
  HttpException,
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
    // 守门 3：每日限额——数一数 usage_logs 里"今天"已提交的 AI 调用次数
    // （限额按"提交"计：提交即占额。真实产品也可按"成功"计，取决于定价策略）
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0); // 本地时区的今天零点
    const used = await this.prisma.usageLog.count({
      where: { userId, action: 'optimize', createdAt: { gte: startOfToday } },
    });
    const limit = Number(process.env.AI_DAILY_LIMIT ?? 20);
    if (used >= limit) {
      // 429 Too Many Requests：限流的标准状态码（HTTPException 泛用款，自定义状态码）
      throw new HttpException(
        `今日 AI 调用次数已达上限（${limit} 次），明天再来`,
        429,
      );
    }

    // 1) 先在数据库落一行 queued 的任务记录（持久账本）
    const task = await this.prisma.aiTask.create({
      data: { userId, promptId, status: 'queued' },
    });
    // 1.5) 占额：写一条用量日志（限额的计数依据就是它）
    await this.prisma.usageLog.create({
      data: { userId, action: 'optimize' },
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
