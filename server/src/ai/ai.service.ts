import { Injectable } from '@nestjs/common';

/**
 * 假 AI（mock）：阶段 2 先用它打通异步全链路。
 * 将来接真服务（DeepSeek 等 OpenAI 兼容接口）时，只换这个文件的实现，
 * 队列、状态机、接口全都不动——这就是"换商不动架构"。
 */
@Injectable()
export class AiService {
  async optimize(body: string): Promise<string> {
    // 模拟调用 AI 的网络 + 推理耗时
    await new Promise((resolve) => setTimeout(resolve, 2500));

    // Task 3 的钩子：正文里带 [必失败] 的提示词会模拟 AI 超时，用来做重试实验
    if (body.includes('[必失败]')) {
      throw new Error('模拟 AI 服务超时');
    }

    // 一个确定性的"伪优化"：给原文套上结构化外壳，肉眼可验收
    return [
      '【AI 优化结果】',
      '1. 角色设定：你是一位严谨的提示词工程师。',
      '2. 原文结构化改写：',
      ...body
        .split('\n')
        .filter((line) => line.trim().length > 0)
        .map((line) => `   - ${line.trim()}`),
      '3. 补充约束：请分步骤思考，再给出最终答案。',
    ].join('\n');
  }
}
