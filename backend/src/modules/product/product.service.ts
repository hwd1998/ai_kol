import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AuditLogService } from '../audit-log/audit-log.service';
import { ProductEntity } from './product.entity';
import type { CreateProductDto } from './dto/create-product.dto';
import type { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(dto: CreateProductDto, actorUserId: number): Promise<ProductEntity> {
    const created = this.productRepo.create({
      ...dto,
      isEnabled: dto.isEnabled ?? true,
    });
    const saved = await this.productRepo.save(created);
    await this.auditLogService.create({
      userId: actorUserId,
      actionType: 'PRODUCT_CREATE',
      targetId: saved.id,
      details: {
        displayName: saved.name,
        name: saved.name,
        enabled: saved.isEnabled,
        previousEnabled: null,
      },
    });
    return saved;
  }

  async findAll(onlyEnabled = false): Promise<ProductEntity[]> {
    return await this.productRepo.find({
      where: onlyEnabled ? { isEnabled: true } : {},
      order: { id: 'DESC' },
    });
  }

  async update(id: number, dto: UpdateProductDto, actorUserId: number): Promise<ProductEntity> {
    const existed = await this.productRepo.findOne({ where: { id } });
    if (!existed) {
      throw new NotFoundException('产品不存在');
    }
    const previousEnabled = existed.isEnabled;
    const merged = this.productRepo.merge(existed, dto);
    const saved = await this.productRepo.save(merged);
    if (saved.isEnabled !== previousEnabled) {
      await this.auditLogService.create({
        userId: actorUserId,
        actionType: 'PRODUCT_SET_ENABLED',
        targetId: id,
        details: {
          displayName: saved.name,
          name: saved.name,
          previousEnabled,
          enabled: saved.isEnabled,
        },
      });
    }
    return saved;
  }

  async remove(id: number): Promise<void> {
    const existed = await this.productRepo.findOne({ where: { id } });
    if (!existed) {
      throw new NotFoundException('产品不存在');
    }
    await this.productRepo.remove(existed);
  }
}
