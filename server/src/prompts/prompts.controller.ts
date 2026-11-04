import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ListPromptsDto } from './dto/list-prompts.dto';
import { PromptsService } from './prompts.service';

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
}
