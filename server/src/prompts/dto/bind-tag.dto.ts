import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * POST /api/prompts/:id/tags 的请求体（REST 答卷 R6 的代码化）。
 * 标签名对齐 tags 表约束：VarChar(50)。
 */
export class BindTagDto {
  @IsString()
  @IsNotEmpty({ message: '标签名不能为空' })
  @MaxLength(50, { message: '标签最多 50 个字符' })
  name: string;
}
