# ---------- 第一阶段：构建 ----------
# 拷源码 → tsc 编译 → 产出 dist/。devDependencies 只存在于这一阶段，
# 最终镜像里不会有 eslint/jest/nest-cli 这些开发期才需要的东西
FROM node:22-alpine AS build
WORKDIR /app

# 先只拷依赖清单再装依赖：只要 package*.json 没变，
# 这一层会被 Docker 缓存复用，改源码重新构建时不用重装依赖
COPY package.json package-lock.json ./
RUN npm ci

# Prisma 客户端按 schema 生成，生成产物落在 node_modules 里
COPY prisma ./prisma
RUN npx prisma generate

# 最后才拷源码并编译（拷得越晚，缓存失效范围越小）
COPY src ./src
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
RUN npm run build

# ---------- 第二阶段：运行 ----------
FROM node:22-alpine
WORKDIR /app

# Prisma 的查询引擎在 Alpine 上依赖系统 openssl（最小镜像不带，必须补）
RUN apk add --no-cache openssl

# 生产依赖（--omit=dev 跳过 eslint/jest 全家桶）
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# prisma CLI 在 dependencies 里，所以运行镜像里可以 generate + migrate deploy
COPY prisma ./prisma
RUN npx prisma generate

# 编译产物从第一阶段拿（第二阶段从来没见过 src，想泄露也拿不到源码）
COPY --from=build /app/dist ./dist

EXPOSE 3000

# 启动前先把没跑过的数据库迁移补齐（migrate deploy 幂等，重复执行无害）
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
