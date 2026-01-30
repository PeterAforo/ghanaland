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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Full-text search listings' })
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  @ApiQuery({ name: 'region', required: false })
  @ApiQuery({ name: 'district', required: false })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'landType', required: false })
  @ApiQuery({ name: 'minPrice', required: false })
  @ApiQuery({ name: 'maxPrice', required: false })
  @ApiQuery({ name: 'minSize', required: false })
  @ApiQuery({ name: 'maxSize', required: false })
  @ApiQuery({ name: 'verifiedOnly', required: false })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['relevance', 'newest', 'oldest', 'price_low', 'price_high', 'size_low', 'size_high', 'popular'] })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async search(@Query() query: any) {
    return this.searchService.fullTextSearch({
      query: query.query,
      region: query.region,
      district: query.district,
      category: query.category,
      landType: query.landType,
      minPrice: query.minPrice ? parseFloat(query.minPrice) : undefined,
      maxPrice: query.maxPrice ? parseFloat(query.maxPrice) : undefined,
      minSize: query.minSize ? parseFloat(query.minSize) : undefined,
      maxSize: query.maxSize ? parseFloat(query.maxSize) : undefined,
      verifiedOnly: query.verifiedOnly === 'true',
      sortBy: query.sortBy || 'relevance',
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
    });
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Get nearby listings based on coordinates' })
  @ApiQuery({ name: 'latitude', required: true })
  @ApiQuery({ name: 'longitude', required: true })
  @ApiQuery({ name: 'radius', required: false, description: 'Radius in kilometers (default: 10)' })
  @ApiQuery({ name: 'limit', required: false })
  async getNearby(@Query() query: any) {
    return this.searchService.getNearbyListings(
      parseFloat(query.latitude),
      parseFloat(query.longitude),
      query.radius ? parseFloat(query.radius) : 10,
      query.limit ? parseInt(query.limit) : 20,
    );
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  @ApiQuery({ name: 'query', required: true })
  async getSuggestions(@Query('query') query: string) {
    return this.searchService.getSearchSuggestions(query);
  }

  // Saved Searches
  @Post('saved')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a saved search' })
  async createSavedSearch(
    @Request() req: any,
    @Body() body: { name: string; filters: any; notifyOnNew?: boolean },
  ) {
    return this.searchService.createSavedSearch(
      req.user.id,
      body.name,
      body.filters,
      body.notifyOnNew ?? true,
    );
  }

  @Get('saved')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all saved searches for current user' })
  async getSavedSearches(@Request() req: any) {
    return this.searchService.getSavedSearches(req.user.id);
  }

  @Get('saved/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a saved search by ID' })
  async getSavedSearch(@Request() req: any, @Param('id') id: string) {
    return this.searchService.getSavedSearch(req.user.id, id);
  }

  @Put('saved/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a saved search' })
  async updateSavedSearch(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { name?: string; filters?: any; notifyOnNew?: boolean },
  ) {
    return this.searchService.updateSavedSearch(req.user.id, id, body);
  }

  @Delete('saved/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a saved search' })
  async deleteSavedSearch(@Request() req: any, @Param('id') id: string) {
    return this.searchService.deleteSavedSearch(req.user.id, id);
  }

  @Get('saved/:id/run')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Run a saved search and get results' })
  async runSavedSearch(@Request() req: any, @Param('id') id: string) {
    return this.searchService.runSavedSearch(req.user.id, id);
  }
}
