# CreatorHub MVP Demo（不使用 Docker）

跨境短视频内容协同管理系统 Demo，当前实现：

- 后端：NestJS + TypeORM + MySQL + JWT + RBAC + Swagger
- 前端：React18 + Vite + Redux Toolkit + Ant Design 5
- 文件上传：本地 `uploads/`，静态访问前缀 `/uploads`

## 目录结构

```text
.
├─ backend/     # 后端服务
├─ frontend/    # 前端页面
└─ uploads/     # 本地视频文件目录（运行时自动创建）
```

## 运行前准备

1) 准备 MySQL（本机）并创建数据库，例如：
- `creatorhub_db`

2) 配置 `backend/.env`（可从 `.env.example` 复制）：
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `JWT_SECRET`
- `DB_SYNCHRONIZE=true`（Demo 便于自动建表）

3) 安装依赖（根目录）：

```bash
npm install
```

## 启动步骤

### 1. 初始化管理员账号（一次即可）

```bash
npm --workspace backend run init:admin
```

默认管理员可通过环境变量覆盖：
- `INIT_ADMIN_USERNAME`（默认 `admin`）
- `INIT_ADMIN_EMAIL`（默认 `admin@creatorhub.local`）
- `INIT_ADMIN_PASSWORD`（默认 `admin123456`）

### 2. 启动后端

```bash
npm run dev:backend
```

- Swagger：`http://localhost:3000/api/docs`

### 3. 启动前端

```bash
npm run dev:frontend
```

- 前端：`http://localhost:5173`

## 端到端演示流程（MVP）

1) 登录页：`/login`
- ADMIN 登录后跳转 `/admin/config`
- CREATOR 登录后跳转 `/creator/upload`

2) 管理员配置基础数据
- 在 `/admin/config` 创建平台与账号簿

3) 达人上传
- 在 `/creator/upload` 选择 `.mp4/.mov`
- 前端走 `init -> chunk -> merge -> create content`
- 状态初始为 `PENDING_REVIEW`

4) 管理员审核
- 在 `/admin/review` 执行通过/驳回

5) 达人发布
- 在 `/creator/upload` 对“待发布”内容执行立即发布或按计划发布
- 发布会更新 `PUBLISHED`、`published_at`、`publisher_id`

6) 审计日志
- 在 `/admin/audit-logs` 查看 `LOGIN / UPLOAD / REVIEW_APPROVE / REVIEW_REJECT / MOCK_PUBLISH`

## 关键后端接口

- 鉴权：`POST /api/auth/login`
- 平台：`/api/platforms`（Admin）
- 账号簿：`/api/social-accounts`（Admin），`GET /api/social-accounts/options`（登录用户）
  - 说明：账号簿中的 `loginUsername` 字段在前端文案为“达人名称”，用于业务展示元数据，不是系统登录账号。
- 上传：`POST /api/uploads/init`、`PUT /api/uploads/chunk`、`POST /api/uploads/merge`
- 内容：`POST /api/contents`、`GET /api/contents/mine`、`GET /api/contents`（Admin）
- 审核：`POST /api/contents/:id/approve`、`POST /api/contents/:id/reject`
- 模拟发布：`POST /api/contents/:id/mock-publish`
- 审计：`GET /api/audit-logs`（Admin）

