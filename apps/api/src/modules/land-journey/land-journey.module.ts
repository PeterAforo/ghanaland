import { Module } from '@nestjs/common';
import { LandJourneyController } from './land-journey.controller';
import { LandJourneyService } from './land-journey.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [LandJourneyController],
  providers: [LandJourneyService, PrismaService],
  exports: [LandJourneyService],
})
export class LandJourneyModule {}
