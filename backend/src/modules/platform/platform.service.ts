import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLogService } from '../audit-log/audit-log.service';
import { PlatformEntity } from './platform.entity';
import type { CreatePlatformDto } from './dto/create-platform.dto';
import type { UpdatePlatformDto } from './dto/update-platform.dto';

@Injectable()
export class PlatformService {
  constructor(
    @InjectRepository(PlatformEntity)
    private readonly platformRepo: Repository<PlatformEntity>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreatePlatformDto, actorUserId: number): Promise<PlatformEntity> {
    const created = this.platformRepo.create({
      ...dto,
      isEnabled: dto.isEnabled ?? true,
    });
    const saved = await this.platformRepo.save(created);
    await this.auditLogService.create({
      userId: actorUserId,
      actionType: 'PLATFORM_CREATE',
      targetId: saved.id,
      details: {
        displayName: `${saved.name} (${saved.region})`,
        name: saved.name,
        region: saved.region,
        enabled: saved.isEnabled,
      },
    });
    return saved;
  }

  async findAll(): Promise<PlatformEntity[]> {
    return await this.platformRepo.find({ order: { id: 'DESC' } });
  }

  async update(id: number, dto: UpdatePlatformDto, actorUserId: number): Promise<PlatformEntity> {
    const existed = await this.platformRepo.findOne({ where: { id } });
    if (!existed) {
      throw new NotFoundException('平台不存在');
    }
    const previousEnabled = existed.isEnabled;
    const merged = this.platformRepo.merge(existed, dto);
    const saved = await this.platformRepo.save(merged);
    if (saved.isEnabled !== previousEnabled) {
      await this.auditLogService.create({
        userId: actorUserId,
        actionType: 'PLATFORM_SET_ENABLED',
        targetId: id,
        details: {
          displayName: `${saved.name} (${saved.region})`,
          name: saved.name,
          region: saved.region,
          previousEnabled,
          enabled: saved.isEnabled,
        },
      });
    }
    return saved;
  }

  async remove(id: number): Promise<void> {
    const existed = await this.platformRepo.findOne({ where: { id } });
    if (!existed) {
      throw new NotFoundException('平台不存在');
    }
    await this.platformRepo.remove(existed);
  }
}

