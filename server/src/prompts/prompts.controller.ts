import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { BindTagDto } from './dto/bind-tag.dto';
import { ListPromptsDto } from './dto/list-prompts.dto';
import { SetFavoriteDto } from './dto/set-favorite.dto';
import { PromptsService } from './prompts.service';
import { UpdatePromptDto } from './dto/update-prompt.dto';
import { OptimizeService } from '../ai/optimize.service';

@Controller('api/prompts')
@UseGuards(JwtAuthGuard) // 挂验票员：写在类上 = 这个家族所有接口都要合法 token
export class PromptsController {
  constructor(
    private readonly promptsService: PromptsService,
    private readonly optimizeService: OptimizeService, // AI 优化放单员（ai 模块借调过来的）
  ) {}

  // GET /api/prompts?page=1&pageSize=10&keyword=xxx
  @Get()
  findAll(@CurrentUser() user: { id: number }, @Query() dto: ListPromptsDto) {
    // user 就是 jwt.strategy validate() 的返回值——从 token 里解冻出来的那个人
    return this.promptsService.findAll(user.id, dto);
  }

  // GET /api/prompts/5 —— 路径参数；ParseIntPipe 把 "5" 转成数字 5，"abc" 直接 400
  @Get(':id')
  findOne(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.promptsService.findOne(user.id, id);
  }

  // POST /api/prompts —— @Post 默认返回 201（真的创建了资源，这次不改状态码）
  @Post()
  create(@CurrentUser() user: { id: number }, @Body() dto: CreatePromptDto) {
    return this.promptsService.create(user.id, dto);
  }

  // PATCH /api/prompts/:id —— 打补丁式修改：只改传了的字段（R4）
  @Patch(':id')
  update(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromptDto,
  ) {
    return this.promptsService.update(user.id, id, dto);
  }

  // POST /api/prompts/:id/tags —— 给某条提示词打标签（R6：层级路径「谁的什么」）
  @Post(':id/tags')
  bindTag(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: BindTagDto,
  ) {
    return this.promptsService.bindTag(user.id, id, dto.name);
  }

  // PUT /api/prompts/:id/favorite —— 收藏设置（R8）：把子状态「覆盖成指定值」，幂等
  @Put(':id/favorite')
  setFavorite(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SetFavoriteDto,
  ) {
    return this.promptsService.setFavorite(user.id, id, dto.value);
  }

  // POST /api/prompts/:id/optimize —— 提交 AI 优化任务：落账+入队，立刻返回单号（阶段 2 主菜）
  @Post(':id/optimize')
  requestOptimize(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.optimizeService.request(user.id, id);
  }

  // DELETE /api/prompts/:id/tags/:tagId —— 从提示词上摘掉一个标签（Step 3 修复后的正式版）
  @Delete(':id/tags/:tagId')
  @HttpCode(204)
  async unbindTag(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Param('tagId', ParseIntPipe) tagId: number,
  ): Promise<void> {
    await this.promptsService.unbindTag(user.id, id, tagId);
  }

  // DELETE /api/prompts/:id —— 成功回 204：办完了，没话要说（R5）
  @Delete(':id')
  @HttpCode(204)
  async remove(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.promptsService.remove(user.id, id);
  }
}
