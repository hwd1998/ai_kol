import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePlatformDto {
  @ApiProperty({ description: '平台名称', example: 'TikTok' })
  @IsString({ message: '平台名称必须是字符串' })
  @MinLength(2, { message: '平台名称长度不能少于 2 位' })
  @MaxLength(50, { message: '平台名称长度不能超过 50 位' })
  name!: string;

  @ApiProperty({ description: '区域', example: 'US' })
  @IsString({ message: '区域必须是字符串' })
  @MinLength(2, { message: '区域长度不能少于 2 位' })
  @MaxLength(10, { message: '区域长度不能超过 10 位' })
  region!: string;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean({ message: 'isEnabled 必须是布尔值' })
  isEnabled?: boolean;
}

