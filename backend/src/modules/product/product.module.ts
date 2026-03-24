import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditLogModule } from '../audit-log/audit-log.module';
import { ProductController } from './product.controller';
import { ProductEntity } from './product.entity';
import { ProductService } from './product.service';

@Module({
  imports: [AuditLogModule, TypeOrmModule.forFeature([ProductEntity])],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
