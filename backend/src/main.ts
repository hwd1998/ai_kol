/**
 * main.ts —— Nest 应用入口（类比前端的 main.tsx）
 * 职责：创建应用、读配置、全局中间件/管道、Swagger、静态资源、监听端口。
 */

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  // 使用根模块 AppModule 创建 Nest 应用实例。
  // 泛型 NestExpressApplication：底层使用 Express，才能使用 useStaticAssets 等 API。
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 从全局配置中读取端口（通常来自 .env 的 PORT），缺省 3000。
  const configService = app.get(ConfigService);
  const port = Number(configService.get<string>('PORT', '3000'));

  // 全局路由前缀：所有 Controller 路径前都会加上 /api
  // 例如 @Controller('auth') + @Post('login') => POST /api/auth/login
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // 跨域：允许浏览器从不同源访问本 API。
  // origin: true 反射请求来源，开发方便；生产建议改为具体域名白名单。
  // credentials: true 允许携带 Cookie、Authorization 等（需前端 fetch 设 credentials）。
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 全局校验管道：在请求进入 Controller 之前，按 DTO 校验并转换 body/query 等。
  // whitelist：剔除 DTO 未声明的字段，防止“多传字段”写入数据库。
  // forbidNonWhitelisted：若存在未声明字段则直接报错（比静默丢弃更安全）。
  // transform：启用 class-transformer 风格的转换（常与 @Type 等配合）。
  // enableImplicitConversion: false：禁止隐式转换，减少 "1" 被悄悄转成 true 这类意外。
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  // OpenAPI / Swagger：自动生成接口文档与“试一试”调试界面。
  const swaggerConfig = new DocumentBuilder()
    .setTitle('CreatorHub API')
    .setDescription('CreatorHub（NestJS + TypeORM + MySQL）接口文档')
    .setVersion('0.1.0')
    // 声明 JWT Bearer 认证方式；'bearer' 是方案名，需与 @ApiBearerAuth('bearer') 一致。
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '在此输入 JWT Token，例如：Bearer eyJhbGciOi...',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  // 挂载路径 = 全局前缀 + /docs => 实际为 /api/docs
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document);

  // 静态文件目录：uploads 下的文件可通过 /uploads/... 直接访问（适合本地上传的视频等）。
  // process.cwd() 一般为项目启动时的工作目录（后端包目录），与 __dirname 不同。
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  await app.listen(port);
}

// 调用自执行的异步启动函数；void 表示明确忽略返回的 Promise（避免 ESLint no-floating-promises）。
void bootstrap();