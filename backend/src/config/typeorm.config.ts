import { type TypeOrmModuleOptions } from '@nestjs/typeorm';

import { type AppConfig } from './configuration';

export function buildTypeOrmOptions(config: AppConfig): TypeOrmModuleOptions {
  return {
    type: 'mysql',
    host: config.database.host,
    port: config.database.port,
    username: config.database.username,
    password: config.database.password,
    database: config.database.name,
    // 简体中文注释：开发期可开启，但生产环境务必关闭并使用迁移
    synchronize: config.database.synchronize,
    logging: config.database.logging,
    // 简体中文注释：自动加载实体，避免手工维护 entities 数组
    autoLoadEntities: true,
  };
}

