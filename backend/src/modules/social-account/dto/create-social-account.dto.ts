import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from 'class-validator';

import type { SocialAccountStatus } from '../social-account.entity';

export class CreateSocialAccountDto {
  @ApiProperty({ description: '关联平台 ID', example: 1 })
  @IsInt({ message: 'platformId 必须是整数' })
  @Min(1, { message: 'platformId 必须大于 0' })
  platformId!: number;

  @ApiProperty({ description: '账号昵称', example: 'US-Account-01' })
  @IsString({ message: '账号昵称必须是字符串' })
  @MinLength(2, { message: '账号昵称长度不能少于 2 位' })
  @MaxLength(80, { message: '账号昵称长度不能超过 80 位' })
  accountName!: string;

  @ApiProperty({ description: '达人名称（账号簿展示字段）', example: '达人A' })
  @IsString({ message: '达人名称必须是字符串' })
  @MinLength(2, { message: '达人名称长度不能少于 2 位' })
  @MaxLength(80, { message: '达人名称长度不能超过 80 位' })
  loginUsername!: string;

  @ApiProperty({ description: '备注（选填）', example: '给达人选择用的元数据', required: false })
  @IsOptional()
  @IsString({ message: '备注必须是字符串' })
  @MaxLength(255, { message: '备注长度不能超过 255 位' })
  remark?: string;

  @ApiProperty({ description: '状态', example: 'ACTIVE', enum: ['ACTIVE', 'DISABLED'] })
  @IsIn(['ACTIVE', 'DISABLED'], { message: 'status 必须是 ACTIVE 或 DISABLED' })
  status!: SocialAccountStatus;
}

