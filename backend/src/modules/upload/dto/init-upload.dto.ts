import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class InitUploadDto {
  @ApiProperty({ description: '原始文件名', example: 'video.mp4' })
  @IsString({ message: 'originalName 必须是字符串' })
  @MaxLength(255, { message: 'originalName 长度不能超过 255 位' })
  originalName!: string;

  @ApiProperty({ description: '文件大小（字节）', example: 12345678 })
  @IsInt({ message: 'fileSize 必须是整数' })
  @Min(1, { message: 'fileSize 必须大于 0' })
  fileSize!: number;

  @ApiProperty({ description: '文件扩展名', example: 'mp4', enum: ['mp4', 'mov'] })
  @IsIn(['mp4', 'mov'], { message: '仅支持 mp4/mov 格式' })
  ext!: 'mp4' | 'mov';

  @ApiProperty({ description: '分片大小（字节），可选', example: 5_242_880, required: false })
  @IsOptional()
  @IsInt({ message: 'chunkSize 必须是整数' })
  @Min(256 * 1024, { message: 'chunkSize 不能小于 256KB' })
  @Max(50 * 1024 * 1024, { message: 'chunkSize 不能大于 50MB' })
  chunkSize?: number;
}

