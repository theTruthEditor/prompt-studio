import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { ListPromptsDto } from './dto/list-prompts.dto';
import { UpdatePromptDto } from './dto/update-prompt.dto';

@Injectable()
export class PromptsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number, dto: ListPromptsDto) {
    const page = dto.page ?? 1; // ?? 是 JS 的「空位合并」：没传就取默认值
    const pageSize = dto.pageSize ?? 10;

    // keyword 可选：传了才拼进 where；... 是对象展开，没传就不加这个键
    const where = {
      userId, // 硬性过滤：只查自己的——数据隔离的根基
      ...(dto.keyword && {
        OR: [
          { title: { contains: dto.keyword } },
          { body: { contains: dto.keyword } },
        ],
      }),
    };

    // 页面需要两个数：本页数据 items + 符合条件的总数 total（前端算总页数用）
    // Promise.all 把两个查询同时发出去并行跑，比一个跑完再跑下一个快
    const [items, total] = await Promise.all([
      this.prisma.prompt.findMany({
        where,
        orderBy: { createdAt: 'desc' }, // 新建的排前面
        skip: (page - 1) * pageSize, // 跳过前几页攒下的条数
        take: pageSize, // 只拿这一页的条数
      }),
      this.prisma.prompt.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(userId: number, id: number) {
    return this.ensureOwned(userId, id);
  }

  /**
   * 「存在且是你的」身份校验——查、改、删三条路都要过这道门，抽成私有方法复用。
   * findFirst 而不是 findUnique：findUnique 只认唯一列（id），
   * 我们要「id 匹配 且 userId 匹配」双条件同时成立。
   * 「不存在」和「存在但不是你的」统一回 404——不透露资源是否真实存在（防枚举）。
   */
  private async ensureOwned(userId: number, id: number) {
    const prompt = await this.prisma.prompt.findFirst({
      where: { id, userId },
    });
    if (!prompt) {
      throw new NotFoundException('提示词不存在');
    }
    return prompt;
  }

  async update(userId: number, id: number, dto: UpdatePromptDto) {
    // 坑位记录：管道 transform 出来的 dto 实例天生带全部声明字段（值为 undefined），
    // Object.keys 永远非空、JSON.stringify 却显示 {}——判断「有没有真字段」
    // 必须用 Object.values 找非 undefined；Prisma 对 undefined 字段是忽略不动
    const hasAnyField = Object.values(dto).some((v) => v !== undefined);
    if (!hasAnyField) {
      // 补丁一个真字段都没带 → 主动拦成 400（你的错），
      // 不拦的话就是一次"无变化更新"——200 却什么都没改，接口语义撒谎
      throw new BadRequestException('至少要提供一个要修改的字段');
    }
    await this.ensureOwned(userId, id); // 先验身份，通过后才敢改
    return this.prisma.prompt.update({ where: { id }, data: dto });
  }

  async remove(userId: number, id: number): Promise<void> {
    await this.ensureOwned(userId, id); // 先验身份，通过后才敢删
    await this.prisma.prompt.delete({ where: { id } });
    // 不 return 任何东西——204 的语义就是「办完了，没话要说」
  }

  async create(userId: number, dto: CreatePromptDto) {
    return this.prisma.prompt.create({
      data: {
        title: dto.title,
        body: dto.body,
        userId, // 归属人从 token 解冻出来，请求体里写了什么 userId 都不理
      },
    });
  }
}
