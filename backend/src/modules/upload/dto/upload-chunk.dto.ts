import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsString, Min } from 'class-validator';

export class UploadChunkDto {
  @ApiProperty({ description: '上传会话 ID', example: 'a1b2c3d4e5f6' })
  @IsString({ message: 'uploadId 必须是字符串' })
  uploadId!: string;

  @ApiProperty({ description: '分片索引（从 0 开始）', example: 0 })
  @Type(() => Number)
  @IsInt({ message: 'index 必须是整数' })
  @Min(0, { message: 'index 不能小于 0' })
  index!: number;
}

