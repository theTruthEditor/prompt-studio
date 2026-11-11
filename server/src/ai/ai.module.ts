import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AiService } from './ai.service';
import { OptimizeService } from './optimize.service';
import { OptimizeProcessor } from './optimize.processor';
import { OptimizationsController } from './optimizations.controller';

@Module({
  imports: [
    // 第二条货架：optimize 专列（和 echo 互不干扰）
    // defaultJobOptions：这趟货架上的单子默认失败自动重试 3 次，
    // 间隔指数递增（2s → 4s → 8s），给下游服务喘息时间
    BullModule.registerQueue({
      name: 'optimize',
      connection: { host: 'localhost', port: 6379 },
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      },
    }),
  ],
  controllers: [OptimizationsController],
  providers: [AiService, OptimizeService, OptimizeProcessor, JwtAuthGuard],
  exports: [OptimizeService], // prompts 家族要借用它的 request() 入队
})
export class AiModule {}
