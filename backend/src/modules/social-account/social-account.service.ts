import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLogService } from '../audit-log/audit-log.service';
import { SocialAccountEntity } from './social-account.entity';
import type { CreateSocialAccountDto } from './dto/create-social-account.dto';
import type { UpdateSocialAccountDto } from './dto/update-social-account.dto';

@Injectable()
export class SocialAccountService {
  constructor(
    @InjectRepository(SocialAccountEntity)
    private readonly accountRepo: Repository<SocialAccountEntity>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateSocialAccountDto, actorUserId: number): Promise<SocialAccountEntity> {
    const created = this.accountRepo.create({
      ...dto,
      remark: dto.remark ?? '',
    });
    const saved = await this.accountRepo.save(created);
    const full = await this.accountRepo.findOne({
      where: { id: saved.id },
      relations: { platform: true },
    });
    const plat = full?.platform;
    const displayName = plat ? `${plat.name}(${plat.region}) - ${saved.accountName}` : saved.accountName;
    await this.auditLogService.create({
      userId: actorUserId,
      actionType: 'SOCIAL_ACCOUNT_CREATE',
      targetId: saved.id,
      details: {
        displayName,
        accountName: saved.accountName,
        platformLabel: plat ? `${plat.name}(${plat.region})` : undefined,
        enabled: saved.status === 'ACTIVE',
      },
    });
    return saved;
  }

  async findAll(): Promise<SocialAccountEntity[]> {
    return await this.accountRepo.find({
      relations: { platform: true },
      order: { id: 'DESC' },
    });
  }

  async findActiveOptions(): Promise<SocialAccountEntity[]> {
    return await this.accountRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.platform', 'p')
      .where('a.status = :st', { st: 'ACTIVE' })
      .andWhere('p.isEnabled = :pen', { pen: true })
      .orderBy('a.id', 'DESC')
      .getMany();
  }

  async update(id: number, dto: UpdateSocialAccountDto, actorUserId: number): Promise<SocialAccountEntity> {
    const existed = await this.accountRepo.findOne({
      where: { id },
      relations: { platform: true },
    });
    if (!existed) {
      throw new NotFoundException('账号不存在');
    }
    const previousStatus = existed.status;
    const merged = this.accountRepo.merge(existed, dto);
    const saved = await this.accountRepo.save(merged);
    if (saved.status !== previousStatus) {
      const full = await this.accountRepo.findOne({
        where: { id: saved.id },
        relations: { platform: true },
      });
      const plat = full?.platform;
      const platLabel = plat ? `${plat.name}(${plat.region})` : '';
      await this.auditLogService.create({
        userId: actorUserId,
        actionType: 'SOCIAL_ACCOUNT_SET_STATUS',
        targetId: id,
        details: {
          displayName: platLabel ? `${platLabel} - ${saved.accountName}` : saved.accountName,
          accountName: saved.accountName,
          platformLabel: platLabel || undefined,
          previousStatus,
          newStatus: saved.status,
        },
      });
    }
    return saved;
  }

  async remove(id: number): Promise<void> {
    const existed = await this.accountRepo.findOne({ where: { id } });
    if (!existed) {
      throw new NotFoundException('账号不存在');
    }
    await this.accountRepo.remove(existed);
  }
}

