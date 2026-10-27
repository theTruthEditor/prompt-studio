# Prompt Studio

像管理代码一样管理写给 AI 的提示词——存储、版本化、打标签、搜索，一键提交给 AI 优化。

这是一个**学习载体优先**的全栈转型项目：以"AI 造、我拆"的方式，走完一个真实产品从数据库设计到部署上线的完整生命周期。开发过程与学习记录全部公开。

## 当前状态

🚧 **阶段 0 · 地基进行中**（SQL / REST / Docker）——练习库已就绪，SQL 训练营开营。

完整路线共 5 个阶段（地基 → 认证+CRUD → 异步能力 → 上线运维 → 进阶+面试），目标约 10 周上线。

## 技术栈

| 层 | 选型 |
|---|---|
| 前端 | Vue 3 + Vite + Element Plus + Pinia |
| 后端 | NestJS + TypeScript |
| 数据库 | PostgreSQL 16 + Prisma |
| 缓存/队列 | Redis 7 + BullMQ |
| 部署 | Docker Compose + Caddy + GitHub Actions |

## 本地开发

```bash
nvm use                                          # Node 22（见 .nvmrc）
docker compose up -d                             # 启动 PostgreSQL 16
docker exec -it prompt-studio-db psql -U postgres -d prompt_studio   # 进入数据库
```

首次启动会自动执行 `db/init/` 下的建表与种子数据脚本（仅数据卷首次初始化时执行）。

## 目录结构

```
├── db/init/           # 数据库初始化脚本（schema + 种子数据）
├── learn/             # 学习记录：练习、考核、复盘（阶段 0 起）
├── docker-compose.yml # 本地开发环境
└── .nvmrc             # Node 版本声明
```

## 一个人的全栈转型

- 方法论：AI 负责实现，人负责架构决策、验收、排障——每个功能必须能讲清"数据从哪来、到哪去、出错怎么办"
- 每阶段有硬性出师标准（动手可验证，不达标不进入下一阶段）
- 学习记录见 `learn/`，含每周复盘与考核答卷
