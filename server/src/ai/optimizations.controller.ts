import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { OptimizeService } from './optimize.service';

// 注意：这个 controller 必须自己挂 Guard——它不在 prompts 家族里，守卫不继承
@Controller('api/optimizations')
@UseGuards(JwtAuthGuard)
export class OptimizationsController {
  constructor(private readonly optimizeService: OptimizeService) {}

  // GET /api/optimizations/:taskId —— 前端轮询任务状态用
  @Get(':taskId')
  findOne(
    @CurrentUser() user: { id: number },
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return this.optimizeService.findOne(user.id, taskId);
  }

  // ↓↓↓ 同事小王的新 PR：把某次优化结果一键应用回提示词（还没 review）
  @Post(':taskId/apply')
  apply(
    @CurrentUser() user: { id: number },
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return this.optimizeService.apply(user.id, taskId);
  }
}
