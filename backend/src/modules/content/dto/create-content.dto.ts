import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsInt, IsString, MaxLength, Min } from 'class-validator';

export class CreateContentDto {
  @ApiProperty({ description: '目标账号 ID（social_accounts.id）', example: 1 })
  @IsInt({ message: 'targetAccountId 必须是整数' })
  @Min(1, { message: 'targetAccountId 必须大于 0' })
  targetAccountId!: number;

  @ApiProperty({ description: '文件相对路径（由 /uploads/merge 返回）', example: '1/abc123/merged/video.mp4' })
  @IsString({ message: 'filePath 必须是字符串' })
  @MaxLength(255, { message: 'filePath 长度不能超过 255 位' })
  filePath!: string;

  @ApiProperty({ description: '原始文件名', example: 'video.mp4' })
  @IsString({ message: 'fileOriginalName 必须是字符串' })
  @MaxLength(255, { message: 'fileOriginalName 长度不能超过 255 位' })
  fileOriginalName!: string;

  @ApiProperty({ description: '产品名称', example: '面霜' })
  @IsString({ message: 'productName 必须是字符串' })
  @MaxLength(120, { message: 'productName 长度不能超过 120 位' })
  productName!: string;

  @ApiProperty({ description: '视频文案', example: '今日好物推荐...' })
  @IsString({ message: 'description 必须是字符串' })
  description!: string;

  @ApiProperty({ description: '计划发布时间（ISO 字符串）', example: '2026-03-19T12:30:00.000Z' })
  @IsDateString({}, { message: 'scheduledTime 必须是合法的日期时间字符串' })
  scheduledTime!: string;
}

