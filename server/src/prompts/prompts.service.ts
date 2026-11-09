import {
  BadRequestException,
  ConflictException,
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
    const [rows, total] = await Promise.all([
      this.prisma.prompt.findMany({
        where,
        orderBy: { createdAt: 'desc' }, // 新建的排前面
        skip: (page - 1) * pageSize, // 跳过前几页攒下的条数
        take: pageSize, // 只拿这一页的条数
        include: { tags: { include: { tag: true } } },
      }),
      this.prisma.prompt.count({ where }),
    ]);

    const items = rows.map((row) => ({
      ...row,
      tags: row.tags.map((pt) => pt.tag), // 同款拍平：只给前端 tag 本体
    }));

    return { items, total, page, pageSize };
  }

  async findOne(userId: number, id: number) {
    return this.ensureOwned(userId, id);
  }

  /**
   * 「存在且是你的」身份校验——查、改、删、打标签都要过这道门，抽成私有方法复用。
   * findFirst 而不是 findUnique：findUnique 只认唯一列（id），
   * 我们要「id 匹配 且 userId 匹配」双条件同时成立。
   * 「不存在」和「存在但不是你的」统一回 404——不透露资源是否真实存在（防枚举）。
   */
  private async ensureOwned(userId: number, id: number) {
    // include 嵌套：顺路把关联标签一起取回（经中间表 prompt_tags 到 tags 表）
    const prompt = await this.prisma.prompt.findFirst({
      where: { id, userId },
      include: { tags: { include: { tag: true } } },
    });
    if (!prompt) {
      throw new NotFoundException('提示词不存在');
    }
    // 拍平：中间表的行 { promptId, tagId, tag: {...} } → 直接的 [{ id, name }]
    // 中间表是实现细节，不该泄漏给前端（API 形状设计）
    return { ...prompt, tags: prompt.tags.map((pt) => pt.tag) };
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

  async bindTag(userId: number, promptId: number, name: string) {
    const prompt = await this.ensureOwned(userId, promptId); // 先确认这条提示词是你的
    // 标签是公共资源（大家共用同一个「SQL」标签）：
    // 不存在就建、存在就取——upsert 就是 findOrCreate
    const tag = await this.prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    const already = await this.prisma.promptTag.findFirst({
      where: { promptId: prompt.id, tagId: tag.id },
    });
    if (already) {
      // 重复绑定 = 冲突 → 409（REST 答卷 R6 的冲突码终于登场）
      throw new ConflictException('该提示词已绑定此标签');
    }
    // 往中间表写一行关系——多对多的落库动作
    await this.prisma.promptTag.create({
      data: { promptId: prompt.id, tagId: tag.id },
    });
    // 重新查一遍：返回带新标签的完整提示词
    return this.findOne(userId, promptId);
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

  // ↓↓↓ 同事的 PR：标签解绑
  async unbindTag(userId: number, id: number, tagId: number) {
    await this.prisma.promptTag.deleteMany({ where: { tagId } });
    return { message: '解绑成功' };
  }

  async setFavorite(userId: number, id: number, value: boolean) {
    await this.ensureOwned(userId, id);
    // 幂等的关键：写入「明确的目标值」，不是「取反」——
    // 发 1 次和发 100 次结果相同，这就是 PUT 对世界的承诺
    return this.prisma.prompt.update({
      where: { id },
      data: { isFavorite: value },
    });
  }
}
