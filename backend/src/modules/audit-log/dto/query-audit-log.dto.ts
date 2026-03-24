import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsIn, IsOptional } from 'class-validator';

import type { AuditActionType } from '../audit-log.entity';

const AUDIT_ACTION_FILTER: AuditActionType[] = [
  'LOGIN',
  'UPLOAD',
  'REVIEW_APPROVE',
  'REVIEW_REJECT',
  'MOCK_PUBLISH',
  'USER_CREATE',
  'USER_SET_ENABLED',
  'PLATFORM_CREATE',
  'PLATFORM_SET_ENABLED',
  'PRODUCT_CREATE',
  'PRODUCT_SET_ENABLED',
  'SOCIAL_ACCOUNT_CREATE',
  'SOCIAL_ACCOUNT_SET_STATUS',
];

export class QueryAuditLogDto {
  @ApiPropertyOptional({
    description: '动作类型筛选',
    enum: AUDIT_ACTION_FILTER,
  })
  @IsOptional()
  @IsIn(AUDIT_ACTION_FILTER)
  actionType?: AuditActionType;

  @ApiPropertyOptional({ description: '开始时间（ISO）', example: '2026-03-19T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startAt?: string;

  @ApiPropertyOptional({ description: '结束时间（ISO）', example: '2026-03-20T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endAt?: string;
}

