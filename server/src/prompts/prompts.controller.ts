import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
// 【import type 铁律】isolatedModules + emitDecoratorMetadata 开着时，
// 只当类型用的东西必须 import type——值导入会让装饰器元数据生成报错
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
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

  // GET /api/prompts/export?format=json|md —— 导出文件下载（模块 5）
  // 【路由顺序铁律】必须注册在 @Get(':id') 之前：Express 按注册顺序匹配，
  // 放后面的话 "export" 会先命中 :id 被 ParseIntPipe 打回 400——接口永远到不了
  @Get('export')
  async exportAll(
    @CurrentUser() user: { id: number },
    @Query('format', new DefaultValuePipe('json')) format: 'json' | 'md',
    @Res({ passthrough: true }) res: Response,
  ) {
    const { content, filename, contentType } = await this.promptsService.exportAll(
      user.id,
      format === 'md' ? 'md' : 'json',
    );
    // passthrough 模式：只借 res 设置文件下载头，响应体仍走 Nest 的返回值通道
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return content;
  }

  // POST /api/prompts/import —— 上传导出的 JSON 批量入库（模块 5）
  // FileInterceptor 用 multer 接住 multipart 表单里的文件，存内存（file.buffer）
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  importJson(
    @CurrentUser() user: { id: number },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.promptsService.importJson(user.id, file);
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

  // GET /api/prompts/:id/snapshots —— 版本历史列表（最新在前，模块 3）
  @Get(':id/snapshots')
  listSnapshots(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.promptsService.listSnapshots(user.id, id);
  }

  // POST /api/prompts/:id/snapshots/:snapshotId/restore —— 回滚到指定快照（模块 3）
  @Post(':id/snapshots/:snapshotId/restore')
  restoreSnapshot(
    @CurrentUser() user: { id: number },
    @Param('id', ParseIntPipe) id: number,
    @Param('snapshotId', ParseIntPipe) snapshotId: number,
  ) {
    return this.promptsService.restoreSnapshot(user.id, id, snapshotId);
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
