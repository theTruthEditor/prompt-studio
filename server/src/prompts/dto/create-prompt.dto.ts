import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * POST /api/prompts 的请求体（REST 答卷 R3 的代码化）。
 * 校验规则和 schema.prisma 对齐：title VarChar(200)、body 不限长。
 */
export class CreatePromptDto {
  @IsString()
  @IsNotEmpty({ message: '标题不能为空' })
  @MaxLength(200, { message: '标题最多 200 个字符' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '正文不能为空' })
  body: string;
}
