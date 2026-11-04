import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PromptsModule } from './prompts/prompts.module';

@Module({
  imports: [AuthModule, PrismaModule, PromptsModule], // PrismaModule 在总部挂一次，全集团生效（@Global）
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
