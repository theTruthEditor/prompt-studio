import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 从 Authorization: Bearer xxx 里取 token
      ignoreExpiration: false,                                   // 过期的一律拒收
      secretOrKey: process.env.JWT_SECRET!,                      // 用 .env 里的密钥验签名（! 告诉 TS：我保证它有值）
    });
  }

  async validate(payload: { sub: number; email: string }) {
    // 代码能走到这一行，说明签名验证已通过（passport-jwt 干的）
    // 返回的对象会被 Nest 暂存，以后受保护接口里能直接拿到当前用户
    return { id: payload.sub, email: payload.email };
  }
}
