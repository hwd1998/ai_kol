import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ description: '用户名', example: 'admin' })
  @IsString({ message: '用户名必须是字符串' })
  username!: string;

  @ApiProperty({ description: '密码', example: 'admin123456' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度不能少于 6 位' })
  password!: string;
}

