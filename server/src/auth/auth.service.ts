import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,     // 仓库管理部（@Global 的效果：没写 imports 也注入成功了）
    private readonly jwtService: JwtService,    // 门票印刷机
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('该邮箱已注册');   // 409——R6 教过的"冲突"码，又见面了

    const hash = await bcrypt.hash(dto.password, 10);          // 明文密码 → 哈希乱码（10 = 加固轮数）
    const user = await this.prisma.user.create({
      data: { email: dto.email, nickname: dto.nickname, passwordHash: hash },
      select: { id: true, email: true, nickname: true, createdAt: true },  // 只挑这些字段返回——passwordHash 永不出门
    });
    return this.issueTokens(user.id);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('邮箱或密码错误');        // 401——登录接口只有 401（R7 的实现）
    }
    return this.issueTokens(user.id);
  }

  private issueTokens(userId: number) {
    const payload = { sub: userId };                            // sub = 载荷里的用户身份字段（惯例名）
    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '2h' }),   // 访问令牌：2 小时
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),  // 刷新令牌：7 天（刷新接口收尾时加）
    };
  }
}
