import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class WithdrawContentDto {
  @ApiPropertyOptional({ description: '撤回备注（可选）', example: '文案还需优化，先撤回修改。' })
  @IsOptional()
  @IsString({ message: 'reason 必须是字符串' })
  @MaxLength(200, { message: 'reason 长度不能超过 200 位' })
  reason?: string;
}
