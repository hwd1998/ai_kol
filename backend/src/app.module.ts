import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { configuration, type AppConfig } from './config/configuration';
import { buildTypeOrmOptions } from './config/typeorm.config';
import { AuthModule } from './modules/auth/auth.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { UploadModule } from './modules/upload/upload.module';
import { ContentModule } from './modules/content/content.module';
import { PlatformModule } from './modules/platform/platform.module';
import { ProductModule } from './modules/product/product.module';
import { SocialAccountModule } from './modules/social-account/social-account.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    // 简体中文注释：全局配置模块，统一从 .env 读取配置，严禁硬编码敏感信息
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    // 简体中文注释：TypeORM 连接配置从 ConfigService 注入读取
    TypeOrmModule.forRootAsync({
      // 简体中文注释：避免错误的 get<AppConfig>('') 造成 cfg 为 undefined
      // configuration() 会从 env 读取完整结构，再由 buildTypeOrmOptions 生成 TypeORM 连接配置。
      useFactory: (): ReturnType<typeof buildTypeOrmOptions> => {
        const cfg: AppConfig = configuration();
        return buildTypeOrmOptions(cfg);
      },
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    AuditLogModule,
    UserModule,
    PlatformModule,
    ProductModule,
    SocialAccountModule,
    UploadModule,
    ContentModule,
  ],
})
export class AppModule {}

