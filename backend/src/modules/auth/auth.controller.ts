import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AuthService, type LoginResult } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: '用户登录（JWT）' })
  @ApiResponse({ status: 201, description: '登录成功，返回 accessToken' })
  @Post('login')
  async login(@Body() dto: LoginDto): Promise<LoginResult> {
    return await this.authService.login(dto.username, dto.password);
  }
}

