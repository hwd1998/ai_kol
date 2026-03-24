import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';

import { AuditLogService } from '../audit-log/audit-log.service';
import { UserEntity, type UserRole } from './user.entity';
import { type CreateUserDto } from './dto/create-user.dto';
import { type AdminCreateUserDto } from './dto/admin-create-user.dto';
import { type UpdateProfileDto } from './dto/update-profile.dto';

export interface RegisterResult {
  accessToken: string;
}

export interface JwtPayload {
  sub: number;
  username: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async register(dto: CreateUserDto): Promise<RegisterResult> {
    const existed = await this.userRepo.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });
    if (existed) {
      throw new ConflictException('用户名或邮箱已存在');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const created = this.userRepo.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
      role: 'CREATOR',
    });
    const saved = await this.userRepo.save(created);

    const payload: JwtPayload = {
      sub: saved.id,
      username: saved.username,
      email: saved.email,
      role: saved.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken };
  }

  async createByAdmin(dto: AdminCreateUserDto, actorUserId: number): Promise<UserEntity> {
    const existed = await this.userRepo.findOne({
      where: [{ username: dto.username }, { email: dto.email }],
    });
    if (existed) {
      throw new ConflictException('用户名或邮箱已存在');
    }
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const created = this.userRepo.create({
      username: dto.username,
      email: dto.email,
      passwordHash,
      role: dto.role,
      isEnabled: dto.isEnabled ?? true,
    });
    const saved = await this.userRepo.save(created);
    await this.auditLogService.create({
      userId: actorUserId,
      actionType: 'USER_CREATE',
      targetId: saved.id,
      details: {
        displayName: saved.username,
        username: saved.username,
        enabled: saved.isEnabled,
      },
    });
    return saved;
  }

  async updateByAdmin(id: number, isEnabled: boolean, actorUserId: number): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const previousEnabled = user.isEnabled;
    user.isEnabled = isEnabled;
    const saved = await this.userRepo.save(user);
    if (previousEnabled !== isEnabled) {
      await this.auditLogService.create({
        userId: actorUserId,
        actionType: 'USER_SET_ENABLED',
        targetId: id,
        details: {
          displayName: saved.username,
          username: saved.username,
          previousEnabled,
          enabled: isEnabled,
        },
      });
    }
    return saved;
  }

  async findAll(): Promise<UserEntity[]> {
    return await this.userRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getProfile(userId: number): Promise<Omit<UserEntity, 'passwordHash'>> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new UnauthorizedException('用户不存在或登录已失效');
    }
    return user;
  }

  async updateProfile(userId: number, dto: UpdateProfileDto): Promise<UserEntity> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在或登录已失效');
    }

    if (dto.username && dto.username !== user.username) {
      const existed = await this.userRepo.findOne({ where: { username: dto.username } });
      if (existed && existed.id !== userId) {
        throw new ConflictException('用户名已存在');
      }
      user.username = dto.username;
    }

    if (dto.email && dto.email !== user.email) {
      const existed = await this.userRepo.findOne({ where: { email: dto.email } });
      if (existed && existed.id !== userId) {
        throw new ConflictException('邮箱已存在');
      }
      user.email = dto.email;
    }

    if (dto.newPassword) {
      user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    }

    return await this.userRepo.save(user);
  }
}

