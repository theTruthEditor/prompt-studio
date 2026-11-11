import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';

// AiModule 提供 OptimizeService（放单员）；PrismaModule 依旧靠 @Global 全局生效
@Module({
  imports: [AiModule],
  controllers: [PromptsController],
  providers: [PromptsService],
})
export class PromptsModule {}
