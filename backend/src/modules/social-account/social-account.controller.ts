import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateSocialAccountDto } from './dto/create-social-account.dto';
import { UpdateSocialAccountDto } from './dto/update-social-account.dto';
import { SocialAccountEntity } from './social-account.entity';
import { SocialAccountService } from './social-account.service';
import { type JwtPayload } from '../user/user.service';

interface AuthedRequest extends Request {
  user?: JwtPayload;
}

@ApiTags('social-accounts')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('social-accounts')
export class SocialAccountController {
  constructor(private readonly socialAccountService: SocialAccountService) {}

  @ApiOperation({ summary: '达人可选账号列表（登录用户）' })
  @ApiResponse({ status: 200, type: [SocialAccountEntity] })
  @Roles('CREATOR', 'REVIEW', 'ADMIN')
  @Get('options')
  async options(): Promise<SocialAccountEntity[]> {
    return await this.socialAccountService.findActiveOptions();
  }

  @ApiOperation({ summary: '创建账号簿记录（Admin）' })
  @ApiResponse({ status: 201, type: SocialAccountEntity })
  @Roles('ADMIN')
  @Post()
  async create(@Req() req: AuthedRequest, @Body() dto: CreateSocialAccountDto): Promise<SocialAccountEntity> {
    const actorUserId = req.user?.sub ?? 0;
    return await this.socialAccountService.create(dto, actorUserId);
  }

  @ApiOperation({ summary: '账号簿列表（Admin）' })
  @ApiResponse({ status: 200, type: [SocialAccountEntity] })
  @Roles('ADMIN')
  @Get()
  async findAll(): Promise<SocialAccountEntity[]> {
    return await this.socialAccountService.findAll();
  }

  @ApiOperation({ summary: '更新账号簿记录（Admin）' })
  @ApiResponse({ status: 200, type: SocialAccountEntity })
  @Roles('ADMIN')
  @Patch(':id')
  async update(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateSocialAccountDto,
  ): Promise<SocialAccountEntity> {
    const actorUserId = req.user?.sub ?? 0;
    return await this.socialAccountService.update(Number(id), dto, actorUserId);
  }

  @ApiOperation({ summary: '删除账号簿记录（Admin）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ ok: true }> {
    await this.socialAccountService.remove(Number(id));
    return { ok: true };
  }
}

