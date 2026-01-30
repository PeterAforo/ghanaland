import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ServiceCatalogService } from './service-catalog.service';
import {
  CreateServiceCatalogDto,
  UpdateServiceCatalogDto,
} from './dto/service-catalog.dto';

@ApiTags('Service Catalog')
@Controller('service-catalog')
export class ServiceCatalogController {
  constructor(private serviceCatalogService: ServiceCatalogService) {}

  // ============================================================================
  // PUBLIC ENDPOINTS
  // ============================================================================

  @Get()
  @ApiOperation({ summary: 'Get all active service catalog items' })
  async getAll(@Query('type') type?: string) {
    return this.serviceCatalogService.getAll(type);
  }

  @Get('by-type/:type')
  @ApiOperation({ summary: 'Get service catalog items by professional type' })
  async getByType(@Param('type') type: string) {
    return this.serviceCatalogService.getByType(type);
  }

  // ============================================================================
  // ADMIN ENDPOINTS
  // ============================================================================

  @Post('admin')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new service catalog item (Admin only)' })
  async create(@Body() dto: CreateServiceCatalogDto) {
    return this.serviceCatalogService.create(dto);
  }

  @Patch('admin/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a service catalog item (Admin only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateServiceCatalogDto) {
    return this.serviceCatalogService.update(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a service catalog item (Admin only)' })
  async delete(@Param('id') id: string) {
    return this.serviceCatalogService.delete(id);
  }

  @Post('admin/seed')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed default service catalog items (Admin only)' })
  async seedDefaults() {
    return this.serviceCatalogService.seedDefaults();
  }
}
