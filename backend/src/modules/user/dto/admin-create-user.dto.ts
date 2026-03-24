import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

import type { UserRole } from '../user.entity';

export class AdminCreateUserDto {
  @ApiProperty({ description: '用户名（唯一）', example: 'alice' })
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名长度不能少于 3 位' })
  @MaxLength(50, { message: '用户名长度不能超过 50 位' })
  username!: string;

  @ApiProperty({ description: '邮箱（唯一）', example: 'alice@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email!: string;

  @ApiProperty({ description: '初始密码', example: 'P@ssw0rd123' })
  @IsString({ message: '密码必须是字符串' })
  @MinLength(6, { message: '密码长度不能少于 6 位' })
  @MaxLength(100, { message: '密码长度不能超过 100 位' })
  password!: string;

  @ApiProperty({ description: '角色', enum: ['CREATOR', 'REVIEW', 'ADMIN'], example: 'CREATOR' })
  @IsIn(['CREATOR', 'REVIEW', 'ADMIN'], { message: '角色必须是 CREATOR / REVIEW / ADMIN 之一' })
  role!: UserRole;

  @ApiPropertyOptional({ description: '是否启用（默认可登录）', default: true })
  @IsOptional()
  @IsBoolean({ message: 'isEnabled 必须是布尔值' })
  isEnabled?: boolean;
}
