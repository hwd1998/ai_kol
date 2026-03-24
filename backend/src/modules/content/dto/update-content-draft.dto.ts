import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateContentDraftDto {
  @ApiPropertyOptional({ description: '目标账号 ID（social_accounts.id）', example: 1 })
  @IsOptional()
  @IsInt({ message: 'targetAccountId 必须是整数' })
  @Min(1, { message: 'targetAccountId 必须大于 0' })
  targetAccountId?: number;

  @ApiPropertyOptional({ description: '产品名称', example: '面霜' })
  @IsOptional()
  @IsString({ message: 'productName 必须是字符串' })
  @MaxLength(120, { message: 'productName 长度不能超过 120 位' })
  productName?: string;

  @ApiPropertyOptional({ description: '视频文案', example: '今日好物推荐...' })
  @IsOptional()
  @IsString({ message: 'description 必须是字符串' })
  description?: string;

  @ApiPropertyOptional({ description: '计划发布时间（ISO 字符串）', example: '2026-03-19T12:30:00.000Z' })
  @IsOptional()
  @IsDateString({}, { message: 'scheduledTime 必须是合法的日期时间字符串' })
  scheduledTime?: string;
}
