import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectContentDto {
  @ApiProperty({ description: '驳回原因', example: '文案不符合规范，请补充商品卖点。' })
  @IsString({ message: 'rejectReason 必须是字符串' })
  @MinLength(2, { message: 'rejectReason 长度不能少于 2 位' })
  rejectReason!: string;
}

