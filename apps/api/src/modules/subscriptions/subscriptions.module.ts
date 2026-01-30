import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { ProFeaturesController } from './pro-features.controller';
import { ProFeaturesService } from './pro-features.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [SubscriptionsController, ProFeaturesController],
  providers: [SubscriptionsService, ProFeaturesService, PrismaService],
  exports: [SubscriptionsService, ProFeaturesService],
})
export class SubscriptionsModule {}
