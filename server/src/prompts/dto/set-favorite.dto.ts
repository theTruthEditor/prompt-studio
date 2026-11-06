import { IsBoolean } from 'class-validator';

/**
 * PUT /api/prompts/:id/favorite 的请求体（REST 答卷 R8 的代码化）。
 * 幂等的关键：body 里明确写「目标状态」，而不是让后端「取反」。
 */
export class SetFavoriteDto {
  @IsBoolean({ message: 'value 必须是 true 或 false' })
  value: boolean; // true = 收藏，false = 取消收藏
}
