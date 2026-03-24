import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: '新用户名', example: 'alice_new' })
  @IsOptional()
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(3, { message: '用户名长度不能少于 3 位' })
  @MaxLength(50, { message: '用户名长度不能超过 50 位' })
  username?: string;

  @ApiPropertyOptional({ description: '新邮箱', example: 'alice_new@example.com' })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiPropertyOptional({ description: '新密码（可选）', example: 'newStrongPass123' })
  @IsOptional()
  @IsString({ message: '新密码必须是字符串' })
  @MinLength(6, { message: '新密码长度不能少于 6 位' })
  @MaxLength(100, { message: '新密码长度不能超过 100 位' })
  newPassword?: string;
}

