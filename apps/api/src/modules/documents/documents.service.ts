import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CloudinaryService } from './cloudinary.service';
import { UploadDocumentDto } from './dto';
import { DocumentType } from '@prisma/client';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
  ) {}

  async uploadDocument(
    userId: string,
    tenantId: string,
    file: Express.Multer.File,
    dto: UploadDocumentDto,
  ) {
    if (dto.listingId) {
      const listing = await this.prisma.listing.findUnique({
        where: { id: dto.listingId },
      });

      if (!listing) {
        throw new NotFoundException('Listing not found');
      }

      if (listing.sellerId !== userId) {
        throw new ForbiddenException('You do not own this listing');
      }
    }

    if (dto.verificationRequestId) {
      const verificationRequest = await this.prisma.verificationRequest.findUnique({
        where: { id: dto.verificationRequestId },
      });

      if (!verificationRequest) {
        throw new NotFoundException('Verification request not found');
      }
    }

    const folder = this.getFolderForDocumentType(dto.documentType);
    const uploadResult = await this.cloudinary.uploadFile(file, folder);

    const document = await this.prisma.document.create({
      data: {
        uploaderId: userId,
        listingId: dto.listingId,
        verificationRequestId: dto.verificationRequestId,
        name: dto.name,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        storageKey: uploadResult.publicId,
        documentType: dto.documentType,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: userId,
        action: 'DOCUMENT_UPLOADED',
        entityType: 'Document',
        entityId: document.id,
        metadata: {
          documentType: dto.documentType,
          fileName: dto.name,
          fileSize: file.size,
        },
      },
    });

    return {
      success: true,
      data: {
        id: document.id,
        name: document.name,
        documentType: document.documentType,
        url: uploadResult.secureUrl,
        thumbnailUrl: this.cloudinary.getThumbnailUrl(uploadResult.publicId),
        createdAt: document.createdAt,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getDocument(documentId: string, userId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        listing: true,
        uploader: { select: { id: true, fullName: true } },
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    const hasAccess = await this.checkDocumentAccess(document, userId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this document');
    }

    return {
      success: true,
      data: {
        id: document.id,
        name: document.name,
        documentType: document.documentType,
        mimeType: document.mimeType,
        sizeBytes: document.sizeBytes,
        url: this.cloudinary.getPublicUrl(document.storageKey),
        thumbnailUrl: this.cloudinary.getThumbnailUrl(document.storageKey),
        uploader: document.uploader,
        createdAt: document.createdAt,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getListingDocuments(listingId: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const documents = await this.prisma.document.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      success: true,
      data: documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        documentType: doc.documentType,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        url: this.cloudinary.getPublicUrl(doc.storageKey),
        thumbnailUrl: this.cloudinary.getThumbnailUrl(doc.storageKey),
        createdAt: doc.createdAt,
      })),
      meta: { requestId: `req_${Date.now()}`, count: documents.length },
      error: null,
    };
  }

  async deleteDocument(documentId: string, userId: string, tenantId: string) {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.uploaderId !== userId) {
      throw new ForbiddenException('You can only delete your own documents');
    }

    await this.cloudinary.deleteFile(document.storageKey);

    await this.prisma.document.delete({
      where: { id: documentId },
    });

    await this.prisma.auditLog.create({
      data: {
        tenantId,
        actorUserId: userId,
        action: 'DOCUMENT_DELETED',
        entityType: 'Document',
        entityId: documentId,
        metadata: {
          documentType: document.documentType,
          fileName: document.name,
        },
      },
    });

    return {
      success: true,
      data: { message: 'Document deleted successfully' },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }

  async getUserDocuments(userId: string) {
    const documents = await this.prisma.document.findMany({
      where: { uploaderId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { select: { id: true, title: true } },
      },
    });

    return {
      success: true,
      data: documents.map((doc) => ({
        id: doc.id,
        name: doc.name,
        documentType: doc.documentType,
        mimeType: doc.mimeType,
        sizeBytes: doc.sizeBytes,
        url: this.cloudinary.getPublicUrl(doc.storageKey),
        thumbnailUrl: this.cloudinary.getThumbnailUrl(doc.storageKey),
        listing: doc.listing,
        createdAt: doc.createdAt,
      })),
      meta: { requestId: `req_${Date.now()}`, count: documents.length },
      error: null,
    };
  }

  private getFolderForDocumentType(type: DocumentType): string {
    const folders: Record<DocumentType, string> = {
      SITE_PLAN: 'ghana-lands/site-plans',
      TITLE_DEED: 'ghana-lands/title-deeds',
      INDENTURE: 'ghana-lands/indentures',
      SURVEY_REPORT: 'ghana-lands/survey-reports',
      ID_DOCUMENT: 'ghana-lands/id-documents',
      PROOF_OF_OWNERSHIP: 'ghana-lands/proof-of-ownership',
      OTHER: 'ghana-lands/other',
    };
    return folders[type] || 'ghana-lands/documents';
  }

  private async checkDocumentAccess(document: any, userId: string): Promise<boolean> {
    if (document.uploaderId === userId) {
      return true;
    }

    if (document.listing && document.listing.sellerId === userId) {
      return true;
    }

    return false;
  }

  async uploadFileOnly(file: Express.Multer.File, folder: string) {
    const uploadResult = await this.cloudinary.uploadFile(file, `ghana-lands/${folder}`);

    return {
      success: true,
      data: {
        url: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
      },
      meta: { requestId: `req_${Date.now()}` },
      error: null,
    };
  }
}
