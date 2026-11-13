import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import IORedis from 'ioredis';

/**
 * worker：货架边的员工。应用一启动它就上岗（连上 Redis 蹲守），
 * 不用人喊——有单就干，没单就蹲着等。
 */
@Injectable()
@Processor('echo', {
  connection: { host: process.env.REDIS_HOST ?? 'localhost', port: 6379 },
})
export class EchoProcessor extends WorkerHost {
  // 干完活把结果写回货架的传送带（独立于队列的 Redis 连接）
  private readonly redis = new IORedis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: 6379,
  });

  async process(job: Job<{ message: string }>): Promise<string> {
    // 干活现场：每来一单，这个方法执行一次
    console.log(`[echo worker] 接单 #${job.id}：${job.data.message}`);
    await new Promise((resolve) => setTimeout(resolve, 3000)); // 模拟慢活：干 3 秒

    const result = `echo: ${job.data.message}`;
    // 结果写回货架：键名带单号，回头按单号对答案
    await this.redis.set(`echo:result:${job.id}`, result);
    return result; // BullMQ 也会把返回值存进 job 的 returnValue，备用
  }
}
