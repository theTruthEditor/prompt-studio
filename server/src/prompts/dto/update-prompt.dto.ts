import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * PATCH /api/prompts/:id 的请求体（REST 答卷 R4 的代码化）。
 * PATCH = 打补丁：只改传了的字段，所以全部字段都是可选的（@IsOptional）。
 */
export class UpdatePromptDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: '标题不能改成空' })
  @MaxLength(200, { message: '标题最多 200 个字符' })
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: '正文不能改成空' })
  body?: string;
}
