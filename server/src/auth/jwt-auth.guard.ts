import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 「验票员」守卫：挂在接口上，没有合法 token 一律 401 拦下。
 * 验票规则本身复用 'jwt' 策略（jwt.strategy.ts），这里只是把它包装成 Nest 守卫。
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
