import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { ContentService } from './content.service';

@Injectable()
export class ContentSchedulerService {
  private readonly logger = new Logger(ContentSchedulerService.name);

  constructor(private readonly contentService: ContentService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledPublish(): Promise<void> {
    const count = await this.contentService.autoPublishDue();
    if (count > 0) {
      this.logger.log(`定时发布：自动发布了 ${count} 条内容`);
    }
  }
}
