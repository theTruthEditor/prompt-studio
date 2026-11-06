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
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { ListPromptsDto } from './dto/list-prompts.dto';
import { PromptsService } from './prompts.service';
import { UpdatePromptDto } from './dto/update-prompt.dto';

@Controller('api/prompts')
@UseGuards(JwtAuthGuard) // 挂验票员：写在类上 = 这个家族所有接口都要合法 token
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

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
