import { Module } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { CloudinaryService } from './cloudinary.service';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService, CloudinaryService],
  exports: [DocumentsService, CloudinaryService],
})
export class DocumentsModule {}
