import 'reflect-metadata';

import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { existsSync } from 'fs';
import { join } from 'path';

import { configuration } from '../config/configuration';
import { UserEntity } from '../modules/user/user.entity';

async function main(): Promise<void> {
  // 简体中文注释：init 脚本会被从 monorepo 根目录调用，需手动加载 backend/.env
  const cwd = process.cwd();
  const envCandidates = [join(cwd, '.env'), join(cwd, 'backend', '.env')];
  for (const p of envCandidates) {
    if (existsSync(p)) {
      dotenv.config({ path: p });
      break;
    }
  }

  const cfg = configuration();
  const adminUsername = process.env.INIT_ADMIN_USERNAME ?? 'admin';
  const adminEmail = process.env.INIT_ADMIN_EMAIL ?? 'admin@creatorhub.local';
  const adminPassword = process.env.INIT_ADMIN_PASSWORD ?? 'admin123456';

  const dataSource = new DataSource({
    type: 'mysql',
    host: cfg.database.host,
    port: cfg.database.port,
    username: cfg.database.username,
    password: cfg.database.password,
    database: cfg.database.name,
    entities: [UserEntity],
    synchronize: cfg.database.synchronize,
    logging: cfg.database.logging,
  });

  await dataSource.initialize();
  try {
    const userRepo = dataSource.getRepository(UserEntity);
    const existed = await userRepo.findOne({ where: { username: adminUsername } });
    if (existed) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      existed.passwordHash = passwordHash;
      existed.role = 'ADMIN';
      existed.email = adminEmail;
      existed.isEnabled = true;
      await userRepo.save(existed);
      console.log(`管理员已存在，已重置密码并更新角色：admin=${adminUsername}`);
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const admin = userRepo.create({
      username: adminUsername,
      email: adminEmail,
      passwordHash,
      role: 'ADMIN',
      isEnabled: true,
    });
    await userRepo.save(admin);
    console.log(`管理员创建成功：${adminUsername}`);
  } finally {
    await dataSource.destroy();
  }
}

void main();

