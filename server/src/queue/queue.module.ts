import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { DevController } from './dev.controller';
import { EchoProcessor } from './echo.processor';

@Module({
  imports: [
    // 货架登记：声明一条名叫 echo 的队列，并告诉它 Redis 在哪
    BullModule.registerQueue({
      name: 'echo',
      connection: { host: 'localhost', port: 6379 },
    }),
  ],
  controllers: [DevController],
  providers: [EchoProcessor],
})
export class QueueModule {}
