import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './dto';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        name: { type: 'string' },
        documentType: { type: 'string' },
        listingId: { type: 'string' },
        verificationRequestId: { type: 'string' },
      },
    },
  })
  async uploadDocument(
    @Request() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|pdf|doc|docx)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.documentsService.uploadDocument(
      req.user.id,
      req.user.tenantId,
      file,
      dto,
    );
  }

  @Get(':documentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get document details' })
  async getDocument(@Request() req: any, @Param('documentId') documentId: string) {
    return this.documentsService.getDocument(documentId, req.user.id);
  }

  @Get('listing/:listingId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all documents for a listing' })
  async getListingDocuments(
    @Request() req: any,
    @Param('listingId') listingId: string,
  ) {
    return this.documentsService.getListingDocuments(listingId, req.user.id);
  }

  @Get('user/my-documents')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all documents uploaded by current user' })
  async getUserDocuments(@Request() req: any) {
    return this.documentsService.getUserDocuments(req.user.id);
  }

  @Delete(':documentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a document' })
  async deleteDocument(@Request() req: any, @Param('documentId') documentId: string) {
    return this.documentsService.deleteDocument(
      documentId,
      req.user.id,
      req.user.tenantId,
    );
  }

  @Post('upload-file')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file and get URL (for service requests)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string' },
      },
    },
  })
  async uploadFile(
    @Request() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|pdf|doc|docx)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body('folder') folder?: string,
  ) {
    return this.documentsService.uploadFileOnly(file, folder || 'service-documents');
  }
}
