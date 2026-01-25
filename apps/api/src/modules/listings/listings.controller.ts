import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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
}
