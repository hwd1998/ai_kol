import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, MoreThanOrEqual, LessThanOrEqual, In, Repository } from 'typeorm';

import { AuditLogEntity, type AuditActionType } from './audit-log.entity';
import { ContentEntity } from '../content/content.entity';

export interface CreateAuditLogInput {
  userId: number;
  actionType: AuditActionType;
  targetId?: number | null;
  details?: Record<string, unknown> | null;
}

const CONTENT_ACTION_TYPES: AuditActionType[] = [
  'UPLOAD',
  'REVIEW_APPROVE',
  'REVIEW_REJECT',
  'MOCK_PUBLISH',
];

const CONFIG_TARGET_ACTION_TYPES: AuditActionType[] = [
  'USER_CREATE',
  'PLATFORM_CREATE',
  'PRODUCT_CREATE',
  'SOCIAL_ACCOUNT_CREATE',
  'USER_SET_ENABLED',
  'PLATFORM_SET_ENABLED',
  'PRODUCT_SET_ENABLED',
  'SOCIAL_ACCOUNT_SET_STATUS',
];

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>,
    @InjectRepository(ContentEntity)
    private readonly contentRepo: Repository<ContentEntity>,
  ) {}

  async create(input: CreateAuditLogInput): Promise<AuditLogEntity> {
    // #region agent log
    void fetch('http://127.0.0.1:7918/ingest/1bae37b7-29e7-49de-89ca-f4fad6e9694e', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '700d9f',
      },
      body: JSON.stringify({
        sessionId: '700d9f',
        runId: 'audit_create',
        hypothesisId: 'H_CREATE_AUDIT_CALL',
        location: 'backend/src/modules/audit-log/audit-log.service.ts:create',
        message: 'auditLogService.create called',
        data: {
          actionType: input.actionType,
          targetId: input.targetId ?? null,
          userId: input.userId,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    const created = this.auditRepo.create({
      userId: input.userId,
      actionType: input.actionType,
      targetId: input.targetId ?? null,
      details: input.details ?? null,
    });
    return await this.auditRepo.save(created);
  }

  async query(filter: {
    actionType?: AuditActionType;
    startAt?: Date;
    endAt?: Date;
  }): Promise<(AuditLogEntity & { targetDisplayName?: string | null })[]> {
    const where: Record<string, unknown> = {};
    if (filter.actionType) {
      where.actionType = filter.actionType;
    }
    if (filter.startAt && filter.endAt) {
      where.createdAt = Between(filter.startAt, filter.endAt);
    } else if (filter.startAt) {
      where.createdAt = MoreThanOrEqual(filter.startAt);
    } else if (filter.endAt) {
      where.createdAt = LessThanOrEqual(filter.endAt);
    }
    const rows = await this.auditRepo.find({
      where,
      relations: { user: true },
      order: { id: 'DESC' },
      take: 300,
    });

    const contentIds = rows
      .filter(
        (r) =>
          r.targetId != null &&
          CONTENT_ACTION_TYPES.includes(r.actionType as AuditActionType),
      )
      .map((r) => r.targetId as number);
    const contentMap = new Map<number, string>();
    if (contentIds.length > 0) {
      const contents = await this.contentRepo.find({
        where: { id: In([...new Set(contentIds)]) },
        relations: { targetAccount: { platform: true } },
      });
      for (const c of contents) {
        const plat = c.targetAccount?.platform;
        const name = plat
          ? `${plat.name}(${plat.region}) - ${c.targetAccount!.accountName}`
          : c.targetAccount?.accountName ?? '-';
        contentMap.set(c.id, name);
      }
    }

    return rows.map((r) => {
      const base = { ...r };
      if (r.actionType === 'LOGIN') {
        (base as AuditLogEntity & { targetDisplayName?: string | null }).targetDisplayName =
          r.user?.username ?? null;
      } else if (CONFIG_TARGET_ACTION_TYPES.includes(r.actionType as AuditActionType)) {
        const d = r.details ?? {};
        const label =
          (d.displayName as string | undefined) ??
          (d.username as string | undefined) ??
          (d.accountName as string | undefined) ??
          null;
        (base as AuditLogEntity & { targetDisplayName?: string | null }).targetDisplayName = label;
      } else if (r.targetId != null && contentMap.has(r.targetId)) {
        (base as AuditLogEntity & { targetDisplayName?: string | null }).targetDisplayName =
          contentMap.get(r.targetId) ?? null;
      } else {
        (base as AuditLogEntity & { targetDisplayName?: string | null }).targetDisplayName = null;
      }
      return base as AuditLogEntity & { targetDisplayName?: string | null };
    });
  }
}

