import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * GET /api/prompts 的查询参数（REST 答卷 R1 的代码化）。
 * query 里来的天生是字符串，@Type(() => Number) 先转成数字再校验。
 */
export class ListPromptsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number; // 第几页，不传默认 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number; // 每页几条，不传默认 10，上限 50（防一次拉爆数据库）

  @IsOptional()
  @IsString()
  keyword?: string; // 模糊搜索：标题或正文包含它
}
