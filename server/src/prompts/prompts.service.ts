import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePromptDto } from './dto/create-prompt.dto';
import { ListPromptsDto } from './dto/list-prompts.dto';

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
    // findFirst 而不是 findUnique：findUnique 只认唯一列（id），
    // 我们要「id 匹配 且 userId 匹配」两个条件同时成立，只能 findFirst
    const prompt = await this.prisma.prompt.findFirst({
      where: { id, userId },
    });
    if (!prompt) {
      // 「不存在」和「存在但不是你的」统一回 404——不透露资源是否真实存在（防枚举）
      throw new NotFoundException('提示词不存在');
    }
    return prompt;
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
