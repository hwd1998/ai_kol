import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ description: '产品名称', example: '面霜' })
  @IsString({ message: '产品名称必须是字符串' })
  @MinLength(2, { message: '产品名称长度不能少于 2 位' })
  @MaxLength(120, { message: '产品名称长度不能超过 120 位' })
  name!: string;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean({ message: 'isEnabled 必须是布尔值' })
  isEnabled?: boolean;
}
