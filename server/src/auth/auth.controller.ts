import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')            // 门牌号：/api/auth 开头的客人进这个平台
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')                // 受理 POST /api/auth/register
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);   // POST 成功 Nest 默认就是 201（R3 的答案）
  }

  @Post('login')
  @HttpCode(200)                   // 登录不是"创建资源"，把默认 201 改成 200
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}