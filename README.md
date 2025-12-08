# 资产管理系统

## 开发启动

1. 复制 `.env.example` 为 `.env`（默认 SQLite）
2. 安装依赖：`npm install`
3. 生成客户端并迁移：`npm run prisma:generate && npm run prisma:migrate`
4. 种子数据：`npm run seed`
5. 运行：`npm run dev`，访问 `http://localhost:3000`

## Docker 一键部署（Postgres）

1. 配置环境变量（如需覆盖默认密码）
2. 执行：`docker compose up -d`
3. 初次启动后进入容器运行迁移与种子（compose 已集成）

## 环境变量

- `DATABASE_URL`：数据库连接字符串（开发默认 `file:./dev.db`）
- `ADMIN_PASSWORD`：登录密码（默认 `admin`，生产请修改）

## 预置类型

- 资产：现金/储蓄、活期、定期、股票、基金、债券、公积金/养老金、房产、车辆、贵金属、加密货币、应收款、其他
- 负债：房贷、车贷、信用卡、消费贷、学生贷、个人借款、应付款、税务负债、其他