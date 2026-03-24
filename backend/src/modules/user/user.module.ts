import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditLogModule } from '../audit-log/audit-log.module';
import { UserController } from './user.controller';
import { UserEntity } from './user.entity';
import { UserService } from './user.service';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    AuditLogModule,
    TypeOrmModule.forFeature([UserEntity]),
    // 简体中文注释：JWT 配置从环境变量读取，严禁硬编码 secret
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'change_me'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d'),
        },
      }),
    }),
  ],
  controllers: [UserController],
  providers: [UserService, JwtStrategy],
})
export class UserModule {}

