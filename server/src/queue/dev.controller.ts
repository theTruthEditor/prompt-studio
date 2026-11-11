import { Body, Controller, Post } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { IsNotEmpty, IsString } from 'class-validator';

// 教学端点的迷你 DTO：规矩和正式接口一样（校验管道会照常拦截）
class EchoDto {
  @IsString()
  @IsNotEmpty({ message: 'message 不能为空' })
  message: string;
}

@Controller('api/dev')
export class DevController {
  // @InjectQueue 按名字把货架递进来——DI，和 PrismaService 一个路数
  constructor(@InjectQueue('echo') private readonly echoQueue: Queue) {}

  // POST /api/dev/echo —— 教学端点（故意不挂 Guard，别照抄到业务里）：
  // 只放单、不干活，所以 HTTP 能秒回
  @Post('echo')
  async echo(@Body() body: EchoDto) {
    const job = await this.echoQueue.add('say', { message: body.message });
    // job.id 就是单号——几秒后去 Redis 对答案用的就是它
    return { jobId: job.id, note: '已上货架，worker 约 3 秒后干完' };
  }
}
