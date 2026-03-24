import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { JwtPayload } from '../user/user.service';
import { ContentEntity } from './content.entity';
import { ContentService } from './content.service';
import { CreateContentDto } from './dto/create-content.dto';
import { AdminContentQueryDto } from './dto/admin-query.dto';
import { RejectContentDto } from './dto/reject-content.dto';
import { UpdateContentDraftDto } from './dto/update-content-draft.dto';
import { WithdrawContentDto } from './dto/withdraw-content.dto';

interface AuthedRequest extends Request {
  user?: JwtPayload;
}

@ApiTags('contents')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contents')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @ApiOperation({ summary: '创建内容记录（Creator / Admin）' })
  @ApiResponse({ status: 201, type: ContentEntity })
  @Roles('CREATOR', 'ADMIN')
  @Post()
  async create(@Req() req: AuthedRequest, @Body() dto: CreateContentDto): Promise<ContentEntity> {
    const userId = req.user?.sub ?? 0;
    return await this.contentService.create(userId, dto);
  }

  @ApiOperation({ summary: '编辑草稿（Creator / Admin）' })
  @ApiResponse({ status: 200, type: ContentEntity })
  @Roles('CREATOR', 'ADMIN')
  @Patch(':id')
  async updateDraft(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateContentDraftDto,
  ): Promise<ContentEntity> {
    const userId = req.user?.sub ?? 0;
    return await this.contentService.updateDraft(Number(id), userId, dto);
  }

  @ApiOperation({ summary: '提交草稿审核（Creator / Admin）' })
  @ApiResponse({ status: 200, type: ContentEntity })
  @Roles('CREATOR', 'ADMIN')
  @Post(':id/submit')
  async submitDraft(@Req() req: AuthedRequest, @Param('id') id: string): Promise<ContentEntity> {
    const userId = req.user?.sub ?? 0;
    return await this.contentService.submitDraft(Number(id), userId);
  }

  @ApiOperation({ summary: '撤回待审核内容（Creator / Admin）' })
  @ApiResponse({ status: 200, type: ContentEntity })
  @Roles('CREATOR', 'ADMIN')
  @Post(':id/withdraw')
  async withdrawPending(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: WithdrawContentDto,
  ): Promise<ContentEntity> {
    const userId = req.user?.sub ?? 0;
    return await this.contentService.withdrawPending(Number(id), userId, dto.reason);
  }

  @ApiOperation({ summary: '我的作品列表（Creator / Admin）' })
  @ApiResponse({ status: 200, type: [ContentEntity] })
  @Roles('CREATOR', 'ADMIN')
  @Get('mine')
  async mine(@Req() req: AuthedRequest): Promise<ContentEntity[]> {
    const userId = req.user?.sub ?? 0;
    return await this.contentService.findMine(userId);
  }

  @ApiOperation({ summary: '全量内容列表（Admin，可筛选）' })
  @ApiResponse({ status: 200, type: [ContentEntity] })
  @Roles('ADMIN', 'REVIEW')
  @Get()
  async adminList(@Query() query: AdminContentQueryDto): Promise<ContentEntity[]> {
    return await this.contentService.findAllForAdmin({
      status: query.status,
      uploaderId: query.uploaderId,
    });
  }

  @ApiOperation({ summary: '内容详情（Creator 仅自己 / Admin 全部）' })
  @ApiResponse({ status: 200, type: ContentEntity })
  @Roles('CREATOR', 'REVIEW', 'ADMIN')
  @Get(':id')
  async detail(@Req() req: AuthedRequest, @Param('id') id: string): Promise<ContentEntity> {
    const contentId = Number(id);
    const role = req.user?.role;
    const userId = req.user?.sub ?? 0;
    if (role === 'ADMIN') {
      return await this.contentService.findOneOrThrow(contentId);
    }
    if (role === 'REVIEW') {
      return await this.contentService.findOneOrThrow(contentId);
    }
    return await this.contentService.assertOwner(contentId, userId);
  }

  @ApiOperation({ summary: '审核通过（Admin）' })
  @ApiResponse({ status: 200, type: ContentEntity })
  @Roles('ADMIN', 'REVIEW')
  @Post(':id/approve')
  async approve(@Req() req: AuthedRequest, @Param('id') id: string): Promise<ContentEntity> {
    const adminId = req.user?.sub ?? 0;
    return await this.contentService.approve(Number(id), adminId);
  }

  @ApiOperation({ summary: '审核驳回（Admin）' })
  @ApiResponse({ status: 200, type: ContentEntity })
  @Roles('ADMIN', 'REVIEW')
  @Post(':id/reject')
  async reject(
    @Req() req: AuthedRequest,
    @Param('id') id: string,
    @Body() dto: RejectContentDto,
  ): Promise<ContentEntity> {
    const adminId = req.user?.sub ?? 0;
    return await this.contentService.reject(Number(id), adminId, dto.rejectReason);
  }

  @ApiOperation({ summary: '立即发布（达人 / Admin）' })
  @ApiResponse({ status: 200, type: ContentEntity })
  @Roles('CREATOR', 'ADMIN')
  @Post(':id/mock-publish')
  async mockPublish(@Req() req: AuthedRequest, @Param('id') id: string): Promise<ContentEntity> {
    const userId = req.user?.sub ?? 0;
    return await this.contentService.mockPublish(Number(id), userId);
  }

  @ApiOperation({ summary: '按计划发布（达人 / Admin）' })
  @ApiResponse({ status: 200, type: ContentEntity })
  @Roles('CREATOR', 'ADMIN')
  @Post(':id/schedule-publish')
  async schedulePublish(@Req() req: AuthedRequest, @Param('id') id: string): Promise<ContentEntity> {
    const userId = req.user?.sub ?? 0;
    return await this.contentService.schedulePublish(Number(id), userId);
  }
}

