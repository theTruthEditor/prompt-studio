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
    const prompt = await this.ensureOwned(userId, id); // 先验身份，通过后才敢改
    // 版本历史（模块 3）：body 真的要变时，先把「旧内容」存一条快照——
    // 改错还有得后悔。只改标题/收藏这类不动正文的操作不产生快照，
    // 「改成同一个内容」也不算变——避免快照表被无意义的行撑爆
    if (dto.body !== undefined && dto.body !== prompt.body) {
      await this.prisma.promptSnapshot.create({
        data: { promptId: prompt.id, body: prompt.body, source: 'edit' },
      });
    }
    return this.prisma.prompt.update({ where: { id }, data: dto });
  }

  /**
   * 快照列表：最新在前，最多 50 条——版本历史是「后悔药」，不是永久档案馆
   */
  async listSnapshots(userId: number, id: number) {
    const prompt = await this.ensureOwned(userId, id);
    return this.prisma.promptSnapshot.findMany({
      where: { promptId: prompt.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /**
   * 回滚：把指定快照的 body 写回提示词。两个设计点：
   * 1. 回滚前先把「当前内容」也存一条快照（source: restore）——
   *    回滚本身也走「先存旧、再改新」的规矩，所以回滚永远可以再回滚（可逆）
   * 2. 快照必须属于这条提示词（findFirst 双条件）——
   *    拿别的提示词/别人的快照 id 来回滚，统一 404，防水平越权（老规矩）
   */
  async restoreSnapshot(userId: number, id: number, snapshotId: number) {
    const prompt = await this.ensureOwned(userId, id);
    const snapshot = await this.prisma.promptSnapshot.findFirst({
      where: { id: snapshotId, promptId: prompt.id },
    });
    if (!snapshot) {
      throw new NotFoundException('快照不存在或不属于该提示词');
    }
    if (snapshot.body === prompt.body) {
      // 快照内容和当前一模一样 = 回滚是空操作 → 400 拒绝「撒谎的成功」
      //（同 update 的空补丁 400：不让接口返回一个什么都没改的 200）
      throw new BadRequestException('快照内容与当前内容相同，无需回滚');
    }
    await this.prisma.promptSnapshot.create({
      data: { promptId: prompt.id, body: prompt.body, source: 'restore' },
    });
    return this.prisma.prompt.update({
      where: { id: prompt.id },
      data: { body: snapshot.body },
    });
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

  /**
   * 导出：把当前用户全部提示词导出为 json 或 md 文件。
   * 返回 { 内容, 文件名, 类型 } 三件套，文件头（Content-Disposition）由 controller 设置。
   * json 是给机器回导的（结构化、可解析）；md 是给人看的（可读性优先）——两种受众两种格式
   */
  async exportAll(userId: number, format: 'json' | 'md') {
    const prompts = await this.prisma.prompt.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { tags: { include: { tag: true } } },
    });
    const date = new Date().toISOString().slice(0, 10);

    if (format === 'md') {
      const lines = [
        '# Prompt Studio 导出',
        '',
        `> 导出时间：${date}　共 ${prompts.length} 条`,
        '',
      ];
      prompts.forEach((p, i) => {
        const tags = p.tags.map((pt) => pt.tag.name).join('、') || '无';
        lines.push(`## ${i + 1}. ${p.title}`);
        lines.push(`- 标签：${tags}　收藏：${p.isFavorite ? '是' : '否'}`);
        lines.push('');
        lines.push(p.body);
        lines.push('');
      });
      return {
        content: lines.join('\n'),
        filename: `prompts-${date}.md`,
        contentType: 'text/markdown; charset=utf-8',
      };
    }

    const data = prompts.map((p) => ({
      title: p.title,
      body: p.body,
      isFavorite: p.isFavorite,
      tags: p.tags.map((pt) => pt.tag.name),
      createdAt: p.createdAt,
    }));
    return {
      content: JSON.stringify(data, null, 2),
      filename: `prompts-${date}.json`,
      contentType: 'application/json; charset=utf-8',
    };
  }

  /**
   * 导入：解析上传的 JSON 文件批量入库。
   * 设计点：
   * 1. 【部分成功语义】坏行跳过、好行入库、最后交报告——不搞"一行坏全部回滚"：
   *    批量导入 300 条挂 1 条，全回滚等于让用户改完再传一次，体验是灾难
   * 2. 上限 500 条：防止一个巨型文件把数据库当靶子打（limits 要有）
   * 3. 标签走 connectOrCreate：和 bindTag 同款逻辑，不存在就建、存在就共用
   * 4. 不去重：同名提示词导入两次就存两份（v1 明确不做去重，重复是用户自己的选择）
   */
  async importJson(userId: number, file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new BadRequestException('请上传文件（字段名 file，内容为导出的 JSON）');
    }
    let rows: unknown;
    try {
      rows = JSON.parse(file.buffer.toString('utf-8'));
    } catch {
      throw new BadRequestException('文件内容不是合法的 JSON');
    }
    if (!Array.isArray(rows)) {
      throw new BadRequestException('JSON 顶层必须是数组（请使用导出的 json 格式文件）');
    }
    if (rows.length === 0) {
      throw new BadRequestException('文件里没有任何数据');
    }
    if (rows.length > 500) {
      throw new BadRequestException('单次最多导入 500 条');
    }

    const report = {
      created: 0,
      skipped: 0,
      errors: [] as { row: number; message: string }[],
    };
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as Record<string, unknown>;
      const title = typeof row.title === 'string' ? row.title.trim() : '';
      const body = typeof row.body === 'string' ? row.body.trim() : '';
      if (!title || !body) {
        report.errors.push({ row: i + 1, message: 'title 或 body 缺失/不是字符串' });
        continue;
      }
      if (title.length > 200) {
        report.errors.push({ row: i + 1, message: 'title 超过 200 字上限' });
        continue;
      }
      const tags = Array.isArray(row.tags)
        ? (row.tags as unknown[]).filter(
            (t): t is string => typeof t === 'string' && t.trim().length > 0,
          )
        : [];
      await this.prisma.prompt.create({
        data: {
          title,
          body,
          userId,
          ...(tags.length > 0 && {
            tags: {
              create: tags.map((name) => ({
                tag: {
                  connectOrCreate: {
                    where: { name },
                    create: { name },
                  },
                },
              })),
            },
          }),
        },
      });
      report.created++;
    }
    return report;
  }

  /**
   * 解绑：从提示词上摘掉一个标签（Step 3 · 修复后的正式版）
   * 守门：先过「存在且是你的」——防水平越权（bug 1 的修复）
   * 范围：deleteMany + 双条件（promptId+tagId），最多命中 1 行（bug 2 的修复）；
   *      没绑过也静默成功（204 语义），不会炸 500——delete 单行版找不到行会抛 P2025
   */
  async unbindTag(userId: number, id: number, tagId: number): Promise<void> {
    const prompt = await this.ensureOwned(userId, id);
    await this.prisma.promptTag.deleteMany({
      where: { promptId: prompt.id, tagId }, // 双条件把范围锁死：只可能命中 0 或 1 行
    });
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
