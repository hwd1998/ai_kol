import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditLogModule } from '../audit-log/audit-log.module';
import { PlatformController } from './platform.controller';
import { PlatformEntity } from './platform.entity';
import { PlatformService } from './platform.service';

@Module({
  imports: [AuditLogModule, TypeOrmModule.forFeature([PlatformEntity])],
  controllers: [PlatformController],
  providers: [PlatformService],
})
export class PlatformModule {}

