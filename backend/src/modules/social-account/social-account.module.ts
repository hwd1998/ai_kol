import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditLogModule } from '../audit-log/audit-log.module';
import { SocialAccountController } from './social-account.controller';
import { SocialAccountEntity } from './social-account.entity';
import { SocialAccountService } from './social-account.service';

@Module({
  imports: [AuditLogModule, TypeOrmModule.forFeature([SocialAccountEntity])],
  controllers: [SocialAccountController],
  providers: [SocialAccountService],
})
export class SocialAccountModule {}

