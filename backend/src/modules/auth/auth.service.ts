import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

import { AuditLogService } from '../audit-log/audit-log.service';
import { UserEntity } from '../user/user.entity';
import type { JwtPayload } from '../user/user.service';

export interface LoginResult {
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async login(username: string, password: string): Promise<LoginResult> {
    // 简体中文注释：passwordHash 字段 select: false，需要显式查询出来用于校验
    const user = await this.userRepo.findOne({
      where: { username },
      select: ['id', 'username', 'email', 'role', 'passwordHash', 'createdAt', 'isEnabled'],
    });
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }
    if (!user.isEnabled) {
      throw new UnauthorizedException('该账号已禁用，无法登录');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    await this.auditLogService.create({
      userId: user.id,
      actionType: 'LOGIN',
      targetId: user.id,
      details: { role: user.role },
    });
    return { accessToken };
  }
}

