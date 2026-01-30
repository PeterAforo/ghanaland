import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ListingsService } from './listings.service';

@ApiTags('Listings')
@Controller('listings')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all listings with filters' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'region', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findAll(@Query() query: any) {
    return this.listingsService.findAll(query);
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user listings' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async findMyListings(@Request() req: any, @Query() query: any) {
    return this.listingsService.findByUser(req.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get listing by ID' })
  async findOne(@Param('id') id: string) {
    return this.listingsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new listing' })
  async create(@Request() req: any, @Body() dto: any) {
    return this.listingsService.create(req.user, dto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a listing' })
  async update(@Request() req: any, @Param('id') id: string, @Body() dto: any) {
    return this.listingsService.update(req.user.id, id, dto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a listing' })
  async delete(@Request() req: any, @Param('id') id: string) {
    return this.listingsService.delete(req.user.id, id);
  }

  @Put(':id/status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update listing status (submit/publish)' })
  async updateStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: { status: string },
  ) {
    return this.listingsService.updateStatus(req.user.id, id, dto.status);
  }

  @Post(':id/media')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload images/videos to a listing' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
    },
  })
  async uploadMedia(
    @Request() req: any,
    @Param('id') id: string,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB for videos
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp|mp4|mov|avi)$/i }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ) {
    return this.listingsService.uploadMedia(req.user.id, id, files);
  }

  @Delete(':id/media/:mediaId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a media item from listing' })
  async deleteMedia(
    @Request() req: any,
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.listingsService.deleteMedia(req.user.id, id, mediaId);
  }

  @Put(':id/media/reorder')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder media items' })
  async reorderMedia(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: { mediaIds: string[] },
  ) {
    return this.listingsService.reorderMedia(req.user.id, id, dto.mediaIds);
  }
}
