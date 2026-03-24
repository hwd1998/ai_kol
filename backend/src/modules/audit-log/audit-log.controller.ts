import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuditLogEntity } from './audit-log.entity';
import { AuditLogService } from './audit-log.service';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';

@ApiTags('audit-logs')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'REVIEW')
@Controller('audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @ApiOperation({ summary: '审计日志查询（Admin）' })
  @ApiResponse({ status: 200, type: [AuditLogEntity] })
  @Get()
  async list(@Query() query: QueryAuditLogDto): Promise<AuditLogEntity[]> {
    return await this.auditLogService.query({
      actionType: query.actionType,
      startAt: query.startAt ? new Date(query.startAt) : undefined,
      endAt: query.endAt ? new Date(query.endAt) : undefined,
    });
  }
}

