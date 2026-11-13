import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { DevController } from './dev.controller';
import { EchoProcessor } from './echo.processor';

@Module({
  imports: [
    // 货架登记：声明一条名叫 echo 的队列，并告诉它 Redis 在哪
    // （REDIS_HOST 由环境变量决定：本地开发没配就是 localhost，
    //  生产容器里 compose 会配成服务名 redis——写死 localhost 在容器里够不着货架）
    BullModule.registerQueue({
      name: 'echo',
      connection: { host: process.env.REDIS_HOST ?? 'localhost', port: 6379 },
    }),
  ],
  controllers: [DevController],
  providers: [EchoProcessor],
})
export class QueueModule {}
