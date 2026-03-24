import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import type { Request } from 'express';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { JwtPayload } from '../user/user.service';
import { InitUploadDto } from './dto/init-upload.dto';
import { UploadChunkDto } from './dto/upload-chunk.dto';
import { MergeChunksDto } from './dto/merge-chunks.dto';
import { UploadService, type InitUploadResult, type MergeResult } from './upload.service';

interface AuthedRequest extends Request {
  user?: JwtPayload;
}

@ApiTags('uploads')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @ApiOperation({ summary: '初始化上传（获取 uploadId，用于断点续传）' })
  @ApiResponse({ status: 201, description: '返回 uploadId、chunkSize、已上传分片列表' })
  @Post('init')
  async init(@Req() req: AuthedRequest, @Body() dto: InitUploadDto): Promise<InitUploadResult> {
    const userId = req.user?.sub;
    const role = req.user?.role;
    if (!userId || (role !== 'CREATOR' && role !== 'ADMIN')) {
      throw new ForbiddenException('仅达人或管理员可执行上传');
    }

    const init = this.uploadService.initUpload(userId, dto.chunkSize);
    const uploadedChunks = this.uploadService.listUploadedChunks(userId, init.uploadId);
    return { ...init, uploadedChunks };
  }

  @ApiOperation({ summary: '上传分片（chunk 二进制）' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'multipart 表单：uploadId、index、file（chunk 二进制）',
    schema: {
      type: 'object',
      properties: {
        uploadId: { type: 'string' },
        index: { type: 'number' },
        file: { type: 'string', format: 'binary' },
      },
      required: ['uploadId', 'index', 'file'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 60 * 1024 * 1024 },
    }),
  )
  @Put('chunk')
  async uploadChunk(
    @Req() req: AuthedRequest,
    @Body() dto: UploadChunkDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ ok: true }> {
    const userId = req.user?.sub;
    const role = req.user?.role;
    if (!userId || (role !== 'CREATOR' && role !== 'ADMIN')) {
      throw new ForbiddenException('仅达人或管理员可执行上传');
    }
    if (!file?.buffer) {
      throw new ForbiddenException('缺少分片文件');
    }
    this.uploadService.saveChunk(userId, dto.uploadId, Number(dto.index), file.buffer);
    return { ok: true };
  }

  @ApiOperation({ summary: '合并分片（生成最终文件）' })
  @ApiResponse({ status: 201, description: '返回相对路径 filePath（用于入库）' })
  @Post('merge')
  async merge(@Req() req: AuthedRequest, @Body() dto: MergeChunksDto): Promise<MergeResult> {
    const userId = req.user?.sub;
    const role = req.user?.role;
    if (!userId || (role !== 'CREATOR' && role !== 'ADMIN')) {
      throw new ForbiddenException('仅达人或管理员可执行上传');
    }
    return await this.uploadService.mergeChunks(userId, dto.uploadId, dto.totalChunks, dto.originalName);
  }
}

