import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ description: '用户名（唯一）', example: 'alice' })
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名长度不能少于 3 位' })
  @MaxLength(50, { message: '用户名长度不能超过 50 位' })
  username!: string;

  @ApiProperty({ description: '邮箱（唯一）', example: 'alice@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email!: string;

  @ApiProperty({ description: '密码（不会返回给前端）', example: 'P@ssw0rd123' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(8, { message: '密码长度不能少于 8 位' })
  @MaxLength(100, { message: '密码长度不能超过 100 位' })
  password!: string;
}

