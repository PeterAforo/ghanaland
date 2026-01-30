import { Module } from '@nestjs/common';
import { ProfessionalsController } from './professionals.controller';
import { ProfessionalsService } from './professionals.service';
import { ServiceCatalogController } from './service-catalog.controller';
import { ServiceCatalogService } from './service-catalog.service';

@Module({
  controllers: [ProfessionalsController, ServiceCatalogController],
  providers: [ProfessionalsService, ServiceCatalogService],
  exports: [ProfessionalsService, ServiceCatalogService],
})
export class ProfessionalsModule {}
