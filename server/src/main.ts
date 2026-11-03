import 'dotenv/config';      // 必须第一行：先把 .env 的密钥装进 process.env
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  // ↑ 全局校验管道：DTO 上的校验标签从此生效；whitelist=true 顺手删掉请求体里的多余字段
  await app.listen(3000);
}
bootstrap();
