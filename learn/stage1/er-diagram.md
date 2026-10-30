# 阶段 1 · ER 图（出师标准① · 上半场）

> ⚠️ 规则：**关 AI、不打开 `server/prisma/schema.prisma`、不翻迁移 SQL**——凭你自己对四张表的理解手写。
> 写完发 AI，与 schema.prisma 逐行比对，差异点 = 知识盲区，全部讲清后 Task 1 出师。

## users

字段（含类型与约束）：
- id: 整数，主键，自增；
- password_hash: 长文本，非空；
- nickname：短文本，非空
- email：短文本，非空，不可重复@unique
- created_at：时间戳，非空，默认当前时间

主键：id(自增)

它指向谁：暂无

谁指向它：prompts表的user_id指向users的id

---

## prompts

字段（含类型与约束）：
- id: 整数，主键，自增；
- user_id: 整数，非空，外键 → users.id
- title：短文本，非空，长度上限200，VARCHAR(200)
- body：长文本，非空；
- is_favorite： 布尔类型，非空， 默认false
- created_at：时间戳，非空，默认当前时间

主键：id(自增)

它指向谁：prompts.xxx_id → users.id

谁指向它：prompt_tags.prompt_id->prompts.id

---

## tags

字段（含类型与约束）：

- id: 整数，主键，自增;
- name：短文本，非空, 不可重复@unique;

主键：id(自增)

它指向谁：暂无

谁指向它：prompt_tags.tag_id->tags.id

---

## prompt_tags

字段（含类型与约束）：
- [prompt_id,tag_id]: 联合主键, 不可重复@unique
- prompt_id: 整数，非空，外键 → prompts.id；
- tag_id: 整数，非空，外键 → tags.id；
主键（特殊在哪）：
主键是一个联合主键，由其他两个表的主键构成的，代表着两个表的关联对应关系
它指向谁：prompt_tags.prompt_id → prompts.id
        prompt_tags.tag_id → tags.id 
谁指向它：暂无

---

## 交卷前自查三问

1. 哪张表是多对多的"中间表"？它的主键为什么特殊？
prompt_tags表，主键得代表其他两个表的关联关系，比较特殊
2. prompts 表身上有几个外键？（小心：标签关系不算它的外键）
一个外键，users
3. 如果删掉一个 tag，某条提示词的关联会发生什么？（依据你写过的某个配置）
会找到这个tag关联的提示词，并且在提示词的标签关联（prompt_tags表）中，删除对应的关系数据。
