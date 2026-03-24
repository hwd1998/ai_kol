import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { ContentEntity, type ContentStatus } from './content.entity';
import type { CreateContentDto } from './dto/create-content.dto';
import type { UpdateContentDraftDto } from './dto/update-content-draft.dto';
import { SocialAccountEntity } from '../social-account/social-account.entity';
import { AuditLogService } from '../audit-log/audit-log.service';

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(ContentEntity)
    private readonly contentRepo: Repository<ContentEntity>,
    @InjectRepository(SocialAccountEntity)
    private readonly socialAccountRepo: Repository<SocialAccountEntity>,
    private readonly auditLogService: AuditLogService,
    private readonly dataSource: DataSource,
  ) {}

  private async assertAccountUsable(targetAccountId: number): Promise<void> {
    const account = await this.socialAccountRepo.findOne({
      where: { id: targetAccountId },
      relations: { platform: true },
    });
    if (!account) {
      throw new BadRequestException('目标账号不存在');
    }
    if (account.status !== 'ACTIVE') {
      throw new BadRequestException('目标账号已禁用，无法提交');
    }
    if (account.platform && !account.platform.isEnabled) {
      throw new BadRequestException('所属平台已禁用，无法提交');
    }
  }

  private ensureCanSubmit(content: ContentEntity): void {
    if (!content.filePath || !content.fileOriginalName) {
      throw new BadRequestException('请先上传视频文件');
    }
    if (!content.targetAccountId) {
      throw new BadRequestException('请选择目标账号');
    }
    if (!content.productName?.trim()) {
      throw new BadRequestException('请输入产品名称');
    }
    if (!content.description?.trim()) {
      throw new BadRequestException('请输入视频文案');
    }
    if (!content.scheduledTime) {
      throw new BadRequestException('请选择计划发布时间');
    }
  }

  async create(uploaderId: number, dto: CreateContentDto): Promise<ContentEntity> {
    await this.assertAccountUsable(dto.targetAccountId);

    const created = this.contentRepo.create({
      uploaderId,
      targetAccountId: dto.targetAccountId,
      filePath: dto.filePath,
      fileOriginalName: dto.fileOriginalName,
      productName: dto.productName,
      description: dto.description,
      scheduledTime: new Date(dto.scheduledTime),
      status: 'DRAFT',
      rejectReason: null,
      publishedAt: null,
      publisherId: null,
      publisher: null,
    });
    const saved = await this.contentRepo.save(created);
    await this.auditLogService.create({
      userId: uploaderId,
      actionType: 'UPLOAD',
      targetId: saved.id,
      details: {
        targetAccountId: saved.targetAccountId,
        filePath: saved.filePath,
        productName: saved.productName,
      },
    });
    return saved;
  }

  async updateDraft(contentId: number, uploaderId: number, dto: UpdateContentDraftDto): Promise<ContentEntity> {
    const content = await this.assertOwner(contentId, uploaderId);
    if (content.status !== 'DRAFT') {
      throw new BadRequestException('仅草稿可编辑');
    }

    if (dto.targetAccountId != null) {
      await this.assertAccountUsable(dto.targetAccountId);
      content.targetAccountId = dto.targetAccountId;
    }
    if (dto.productName != null) {
      content.productName = dto.productName;
    }
    if (dto.description != null) {
      content.description = dto.description;
    }
    if (dto.scheduledTime != null) {
      content.scheduledTime = new Date(dto.scheduledTime);
    }

    const saved = await this.contentRepo.save(content);
    await this.auditLogService.create({
      userId: uploaderId,
      actionType: 'CONTENT_EDIT',
      targetId: saved.id,
      details: {
        targetAccountId: saved.targetAccountId,
        productName: saved.productName,
        scheduledTime: saved.scheduledTime.toISOString(),
      },
    });
    return await this.findOneOrThrow(saved.id);
  }

  async submitDraft(contentId: number, uploaderId: number): Promise<ContentEntity> {
    const content = await this.assertOwner(contentId, uploaderId);
    if (content.status !== 'DRAFT') {
      throw new BadRequestException('仅草稿可提交审核');
    }
    await this.assertAccountUsable(content.targetAccountId);
    this.ensureCanSubmit(content);
    content.status = 'PENDING_REVIEW';
    content.rejectReason = null;
    const saved = await this.contentRepo.save(content);
    await this.auditLogService.create({
      userId: uploaderId,
      actionType: 'CONTENT_SUBMIT',
      targetId: saved.id,
      details: {
        previousStatus: 'DRAFT',
        newStatus: 'PENDING_REVIEW',
        targetAccountId: saved.targetAccountId,
        productName: saved.productName,
      },
    });
    return await this.findOneOrThrow(saved.id);
  }

  async withdrawPending(contentId: number, uploaderId: number, reason?: string): Promise<ContentEntity> {
    const content = await this.assertOwner(contentId, uploaderId);
    if (content.status !== 'PENDING_REVIEW') {
      throw new BadRequestException('仅待审核内容可撤回');
    }
    content.status = 'DRAFT';
    const saved = await this.contentRepo.save(content);
    await this.auditLogService.create({
      userId: uploaderId,
      actionType: 'CONTENT_WITHDRAW',
      targetId: saved.id,
      details: {
        previousStatus: 'PENDING_REVIEW',
        newStatus: 'DRAFT',
        reason: reason ?? null,
      },
    });
    return await this.findOneOrThrow(saved.id);
  }

  async findMine(uploaderId: number): Promise<ContentEntity[]> {
    return await this.contentRepo.find({
      where: { uploaderId },
      relations: { uploader: true, targetAccount: { platform: true } },
      order: { id: 'DESC' },
    });
  }

  async findAllForAdmin(filter: { status?: ContentStatus; uploaderId?: number }): Promise<ContentEntity[]> {
    const where: Partial<Record<keyof ContentEntity, unknown>> = {};
    if (filter.status) where.status = filter.status;
    if (filter.uploaderId) where.uploaderId = filter.uploaderId;
    return await this.contentRepo.find({
      where: where as never,
      relations: { uploader: true, targetAccount: { platform: true }, publisher: true },
      order: { id: 'DESC' },
    });
  }

  async findOneOrThrow(id: number): Promise<ContentEntity> {
    const content = await this.contentRepo.findOne({
      where: { id },
      relations: { uploader: true, targetAccount: { platform: true }, publisher: true },
    });
    if (!content) {
      throw new NotFoundException('内容不存在');
    }
    return content;
  }

  async assertOwner(contentId: number, uploaderId: number): Promise<ContentEntity> {
    const content = await this.findOneOrThrow(contentId);
    if (content.uploaderId !== uploaderId) {
      throw new ForbiddenException('无权访问该内容');
    }
    return content;
  }

  async approve(contentId: number, adminId: number): Promise<ContentEntity> {
    const content = await this.findOneOrThrow(contentId);
    if (content.status !== 'PENDING_REVIEW') {
      throw new BadRequestException('仅待审核内容可执行通过');
    }
    content.status = 'APPROVED';
    content.rejectReason = null;
    const saved = await this.contentRepo.save(content);
    await this.auditLogService.create({
      userId: adminId,
      actionType: 'REVIEW_APPROVE',
      targetId: saved.id,
      details: {
        previousStatus: 'PENDING_REVIEW',
        newStatus: 'APPROVED',
        productName: saved.productName,
        fileOriginalName: saved.fileOriginalName,
      },
    });
    return saved;
  }

  async reject(contentId: number, adminId: number, rejectReason: string): Promise<ContentEntity> {
    const content = await this.findOneOrThrow(contentId);
    if (content.status !== 'PENDING_REVIEW') {
      throw new BadRequestException('仅待审核内容可执行驳回');
    }
    const previousStatus = content.status;
    content.status = 'REJECTED';
    content.rejectReason = rejectReason;
    const saved = await this.contentRepo.save(content);
    await this.auditLogService.create({
      userId: adminId,
      actionType: 'REVIEW_REJECT',
      targetId: saved.id,
      details: {
        rejectReason,
        previousStatus,
        newStatus: 'REJECTED',
        productName: saved.productName,
        fileOriginalName: saved.fileOriginalName,
      },
    });
    return saved;
  }

  async mockPublish(contentId: number, adminId: number): Promise<ContentEntity> {
    const saved = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(ContentEntity);
      const content = await repo.findOne({ where: { id: contentId } });
      if (!content) {
        throw new NotFoundException('内容不存在');
      }
      if (content.status !== 'APPROVED') {
        throw new BadRequestException('仅待发布（APPROVED）内容可模拟发布');
      }
      content.status = 'PUBLISHED';
      content.publishMode = 'MANUAL';
      content.publishedAt = new Date();
      content.publisherId = adminId;
      content.rejectReason = null;
      return await repo.save(content);
    });

    await this.auditLogService.create({
      userId: adminId,
      actionType: 'MOCK_PUBLISH',
      targetId: saved.id,
      details: {
        newStatus: 'PUBLISHED',
        publishMode: 'MANUAL',
        publishedAt: saved.publishedAt?.toISOString() ?? null,
        publisherId: adminId,
        productName: saved.productName,
        fileOriginalName: saved.fileOriginalName,
      },
    });
    return await this.findOneOrThrow(saved.id);
  }

  async schedulePublish(contentId: number, adminId: number): Promise<ContentEntity> {
    const content = await this.findOneOrThrow(contentId);
    if (content.status !== 'APPROVED') {
      throw new BadRequestException('仅待发布（APPROVED）内容可设置定时发布');
    }
    content.publishMode = 'SCHEDULED';
    content.publisherId = adminId;
    const saved = await this.contentRepo.save(content);
    await this.auditLogService.create({
      userId: adminId,
      actionType: 'MOCK_PUBLISH',
      targetId: saved.id,
      details: {
        publishMode: 'SCHEDULED',
        scheduledTime: saved.scheduledTime?.toISOString() ?? null,
        publisherId: adminId,
        productName: saved.productName,
        fileOriginalName: saved.fileOriginalName,
      },
    });
    return await this.findOneOrThrow(saved.id);
  }

  async autoPublishDue(): Promise<number> {
    const now = new Date();
    const dueContents = await this.contentRepo.find({
      where: {
        status: 'APPROVED',
        publishMode: 'SCHEDULED',
      },
    });
    let count = 0;
    for (const content of dueContents) {
      if (content.scheduledTime <= now) {
        content.status = 'PUBLISHED';
        content.publishedAt = new Date();
        await this.contentRepo.save(content);
        await this.auditLogService.create({
          userId: content.publisherId ?? 0,
          actionType: 'MOCK_PUBLISH',
          targetId: content.id,
          details: {
            publishMode: 'SCHEDULED_AUTO',
            productName: content.productName,
            fileOriginalName: content.fileOriginalName,
            publishedAt: content.publishedAt?.toISOString() ?? null,
          },
        });
        count += 1;
      }
    }
    return count;
  }
}

