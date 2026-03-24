import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditLogEntity } from './audit-log.entity';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { ContentEntity } from '../content/content.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity, ContentEntity])],
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}

