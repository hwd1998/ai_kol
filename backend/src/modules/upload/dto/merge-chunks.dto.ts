import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, Min } from 'class-validator';

export class MergeChunksDto {
  @ApiProperty({ description: '上传会话 ID', example: 'a1b2c3d4e5f6' })
  @IsString({ message: 'uploadId 必须是字符串' })
  uploadId!: string;

  @ApiProperty({ description: '总分片数', example: 10 })
  @IsInt({ message: 'totalChunks 必须是整数' })
  @Min(1, { message: 'totalChunks 必须大于 0' })
  totalChunks!: number;

  @ApiProperty({ description: '原始文件名', example: 'video.mp4' })
  @IsString({ message: 'originalName 必须是字符串' })
  originalName!: string;
}

