import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditLogModule } from '../audit-log/audit-log.module';
import { SocialAccountEntity } from '../social-account/social-account.entity';
import { ContentController } from './content.controller';
import { ContentEntity } from './content.entity';
import { ContentSchedulerService } from './content-scheduler.service';
import { ContentService } from './content.service';

@Module({
  imports: [TypeOrmModule.forFeature([ContentEntity, SocialAccountEntity]), AuditLogModule],
  controllers: [ContentController],
  providers: [ContentService, ContentSchedulerService],
})
export class ContentModule {}

