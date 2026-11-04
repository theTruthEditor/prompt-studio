import { Module } from '@nestjs/common';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';

// 注意 imports 里没有 PrismaModule——@Global 全局模块的效果再次生效
@Module({
  controllers: [PromptsController],
  providers: [PromptsService],
})
export class PromptsModule {}
