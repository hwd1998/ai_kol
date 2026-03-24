import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

import type { ContentStatus } from '../content.entity';

export class AdminContentQueryDto {
  @ApiPropertyOptional({ description: '状态筛选', enum: ['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED'] })
  @IsOptional()
  @IsIn(['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'PUBLISHED'])
  status?: ContentStatus;

  @ApiPropertyOptional({ description: '达人 ID 筛选', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  uploaderId?: number;
}

