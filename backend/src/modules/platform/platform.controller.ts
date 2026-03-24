import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { type Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreatePlatformDto } from './dto/create-platform.dto';
import { UpdatePlatformDto } from './dto/update-platform.dto';
import { PlatformEntity } from './platform.entity';
import { PlatformService } from './platform.service';
import { type JwtPayload } from '../user/user.service';

interface AuthedRequest extends Request {
  user?: JwtPayload;
}

@ApiTags('platforms')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('platforms')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @ApiOperation({ summary: '创建平台（Admin）' })
  @ApiResponse({ status: 201, type: PlatformEntity })
  @Post()
  async create(@Req() req: AuthedRequest, @Body() dto: CreatePlatformDto): Promise<PlatformEntity> {
    const actorUserId = req.user?.sub ?? 0;
    return await this.platformService.create(dto, actorUserId);
  }

  @ApiOperation({ summary: '平台列表（Admin）' })
  @ApiResponse({ status: 200, type: [PlatformEntity] })
  @Get()
  async findAll(): Promise<PlatformEntity[]> {
    return await this.platformService.findAll();
  }

  @ApiOperation({ summary: '更新平台（Admin）' })
  @ApiResponse({ status: 200, type: PlatformEntity })
  @Patch(':id')
  async update(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: UpdatePlatformDto,
  ): Promise<PlatformEntity> {
    const actorUserId = req.user?.sub ?? 0;
    return await this.platformService.update(Number(id), dto, actorUserId);
  }

  @ApiOperation({ summary: '删除平台（Admin）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ ok: true }> {
    await this.platformService.remove(Number(id));
    return { ok: true };
  }
}

