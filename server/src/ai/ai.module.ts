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
    BullModule.registerQueue({
      name: 'optimize',
      connection: { host: 'localhost', port: 6379 },
    }),
  ],
  controllers: [OptimizationsController],
  providers: [AiService, OptimizeService, OptimizeProcessor, JwtAuthGuard],
  exports: [OptimizeService], // prompts 家族要借用它的 request() 入队
})
export class AiModule {}
