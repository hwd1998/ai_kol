import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class AdminUpdateUserDto {
  @ApiProperty({ description: '是否允许登录系统', example: true })
  @IsBoolean({ message: 'isEnabled 必须是布尔值' })
  isEnabled!: boolean;
}
