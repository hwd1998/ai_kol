# CreatorHub 后端学习笔记（NestJS + TypeScript）

本文档面向：**读懂本仓库后端结构** + **入门 Nest + TS 开发**。代码路径以仓库内 `backend/` 为准。

---

## 1. 技术栈一览

| 类别 | 技术 |
|------|------|
| 框架 | NestJS 10 |
| 语言 | TypeScript 5 |
| ORM | TypeORM 0.3 |
| 数据库 | MySQL（`mysql2`） |
| 认证 | JWT（`@nestjs/jwt`）+ Passport JWT（`passport-jwt`） |
| 校验 | `class-validator` + `class-transformer` |
| 文档 | Swagger（`@nestjs/swagger`） |
| 定时任务 | `@nestjs/schedule` |
| HTTP 平台 | Express（`@nestjs/platform-express`） |

常用脚本见 `backend/package.json`：`start:dev`（开发热重载）、`build`、`start:prod`、`init:admin`。

---

## 2. NestJS 核心概念（与本项目对应）

1. **Module（模块）**  
   用 `@Module({ imports, controllers, providers, exports })` 组织一块功能。根模块是 `AppModule`，再按业务拆成 `modules/*`。

2. **Controller（控制器）**  
   处理 HTTP 路由：`@Controller('xxx')` + `@Get` / `@Post` 等。只负责**收请求、调 Service、返回结果**，不写复杂业务。

3. **Service（服务）**  
   `@Injectable()` 的业务类，通过**构造函数注入**到 Controller 或其它 Service。数据库访问、鉴权逻辑等多放在这里。

4. **依赖注入（DI）**  
   Nest 容器根据类型/Token 自动创建实例。你在构造函数里写 `constructor(private readonly x: XService)` 即可。

5. **Guard（守卫）**  
   在到达路由处理函数前决定是否放行，常用于 JWT 校验、角色校验。本项目：`JwtAuthGuard`、`RolesGuard`。

6. **Pipe（管道）**  
   对入参做转换与校验。全局管道在 `main.ts` 里配置了 `ValidationPipe`。

7. **Decorator（装饰器）**  
   如 `@Body()`、`@Req()`、`@UseGuards()`、`@Roles()`，本质是元数据 + 框架约定。

---

## 3. 启动与全局配置：`main.ts`

文件：`backend/src/main.ts`

要点：

- **`NestFactory.create<NestExpressApplication>(AppModule)`**：创建应用，并选用 Express 适配（便于 `useStaticAssets`）。
- **全局前缀 `api`**：`app.setGlobalPrefix('api')` → 实际路径形如 `/api/user/register`。
- **CORS**：`enableCors({ origin: true, credentials: true })`（生产建议收紧 `origin`）。
- **全局 `ValidationPipe`**：
  - `whitelist: true`：去掉 DTO 上未声明的属性；
  - `forbidNonWhitelisted: true`：若请求体带多余字段会 400（前端字段名必须与 DTO 一致）；
  - `transform: true`：把 plain object 转成 DTO 实例以便校验。
- **Swagger**：文档地址 **`/api/docs`**，JWT 使用 Bearer 方案名 **`bearer`**（与 `@ApiBearerAuth('bearer')` 对应）。
- **静态目录**：`uploads` 映射到 **`/uploads`**，用于本地上传视频等。

---

## 4. 根模块：`app.module.ts`

文件：`backend/src/app.module.ts`

- **`ConfigModule.forRoot`**：`isGlobal: true`，全应用可注入 `ConfigService`；`load: [configuration]` 对应 `config/configuration.ts`。
- **`TypeOrmModule.forRootAsync`**：用 `configuration()` + `buildTypeOrmOptions()` 生成 MySQL 连接；`autoLoadEntities: true` 自动加载各模块注册的实体。
- **`ScheduleModule.forRoot()`**：启用定时任务（如内容模块里的调度）。
- **业务模块**：`AuthModule`、`AuditLogModule`、`UserModule`、`PlatformModule`、`ProductModule`、`SocialAccountModule`、`UploadModule`、`ContentModule`。

---

## 5. 配置与环境变量

文件：`backend/src/config/configuration.ts`

- 从 `process.env` 读取 `PORT`、`JWT_SECRET`、`JWT_EXPIRES_IN`、`DB_*`、`DB_SYNCHRONIZE`、`DB_LOGGING` 等。
- **注意**：`JwtModule.registerAsync` 里使用的是 **`ConfigService.get('JWT_SECRET')` 这类扁平 key**（与 `configuration()` 返回的嵌套对象是两套用法），部署时以 `.env` 里 **JWT_***、**DB_*** 为准。

数据库选项：`backend/src/config/typeorm.config.ts`（`synchronize` 生产务必慎用，应用迁移管理表结构）。

---

## 6. 业务模块目录（`backend/src/modules/`）

| 模块 | 职责简述 |
|------|-----------|
| **auth** | 登录：`POST /api/auth/login`，签发 JWT |
| **user** | 注册、个人资料、管理员用户管理；注册 **`JwtStrategy`**（Passport） |
| **platform / product / social-account** | 平台、产品、社媒账号等 CRUD |
| **content** | 内容相关 API + **`ContentSchedulerService`** 定时逻辑 |
| **upload** | 上传相关（如分片、合并等，视具体实现） |
| **audit-log** | 审计日志写入与查询，供管理端使用 |

每个模块通常包含：`*.module.ts`、`*.controller.ts`、`*.service.ts`、`*.entity.ts`、`dto/*.ts`。

---

## 7. 认证与授权流程

### 7.1 JWT 签发（登录 / 注册）

- `AuthModule` / `UserService` 等业务在验证用户名密码后，用 `JwtService.sign` 生成 token（具体 payload 类型见 `user.service.ts` 中的 `JwtPayload`）。

### 7.2 JWT 校验（受保护接口）

- **`JwtStrategy`**（`user/jwt.strategy.ts`）：从 `Authorization: Bearer <token>` 取 JWT，用 `JWT_SECRET` 校验；`validate` 返回值挂在 **`req.user`**。
- **`JwtAuthGuard`**：继承 `AuthGuard('jwt')`，在需要登录的接口上加 `@UseGuards(JwtAuthGuard)`。

### 7.3 角色控制

- **`@Roles('ADMIN')`**（`common/decorators/roles.decorator.ts`）声明允许的角色。
- **`RolesGuard`**：读取 handler/class 上的元数据，与 `req.user.role` 比对。
- 典型写法（见 `user.controller.ts`）：`@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN')`，并在 Swagger 上标 `@ApiBearerAuth('bearer')`。

---

## 8. DTO 与校验

- DTO 类使用 `class-validator` 装饰器（如 `@IsString()`、`@MinLength()`）。
- 全局 `ValidationPipe` 会自动校验 `@Body()` 等；**多余字段会 400**（`forbidNonWhitelisted`）。
- 响应侧可用 `class-transformer` 的 `plainToInstance` 控制序列化字段（如管理员接口返回 `UserEntity`）。

---

## 9. TypeORM 使用方式

- 在模块中：`TypeOrmModule.forFeature([SomeEntity])` 注册实体。
- 在 Service 中：注入 `Repository<Entity>`（`@InjectRepository(Entity)`）进行 CRUD。
- 实体文件：`*.entity.ts`，与数据库表映射。

---

## 10. Swagger 调试建议

1. 启动后端：`cd backend && npm run start:dev`
2. 浏览器打开：`http://localhost:3000/api/docs`（端口以 `PORT` 为准）
3. 先调 `auth/login` 或 `user/register` 拿 token，点击 **Authorize**，方案选 Bearer，填入 token。

---

## 11. 推荐阅读顺序（结合本仓库）

1. `main.ts` → `app.module.ts`  
2. `modules/auth`（登录入口）  
3. `modules/user`（`JwtStrategy`、`UserController` 守卫用法）  
4. 任选一个资源模块（如 `platform`）走通：Module → Controller → Service → Entity → DTO  
5. `modules/audit-log`（看如何在 Service 里记审计）  
6. `modules/content` + `ContentSchedulerService`（定时任务）

---

## 12. Nest + TS 学习资源（通用）

- Nest 官方文档：概念（Providers、Modules、Middleware、Guards、Pipes、Interceptors、Exception filters）按顺序过一遍。  
- TypeScript：接口、泛型、装饰器语法、严格模式 `strict` 对 Nest 项目很有帮助。  
- 练习：在本项目中为某个模块新增一个只读 `GET` 接口（DTO + Service + Swagger 注解），熟悉整条链路。

---

## 13. 关键文件索引

| 文件 | 作用 |
|------|------|
| `backend/src/main.ts` | 启动、全局前缀、CORS、ValidationPipe、Swagger、静态资源 |
| `backend/src/app.module.ts` | 聚合配置、数据库、各业务模块 |
| `backend/src/config/configuration.ts` | 环境变量映射 |
| `backend/src/config/typeorm.config.ts` | TypeORM 连接选项 |
| `backend/src/common/guards/*.ts` | JWT、角色守卫 |
| `backend/src/common/decorators/roles.decorator.ts` | `@Roles` |
| `backend/src/modules/user/jwt.strategy.ts` | Passport JWT 策略 |

---

*文档生成说明：若需自动写入仓库根目录 `study.md`，请在 Cursor 中切换到 Agent 模式后让助手创建文件。*