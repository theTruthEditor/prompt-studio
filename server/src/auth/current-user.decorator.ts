import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * 取参装饰器 @CurrentUser()：从请求上摘出「当前登录用户」。
 * 数据来源：jwt.strategy.ts 的 validate() 返回值（Nest 自动挂在 request.user 上）。
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    // 泛型参数告诉 TS：request 上挂着一个 user（由验票员的 validate() 写入）
    const request = ctx.switchToHttp().getRequest<{ user: { id: number } }>();
    return request.user;
  },
);
