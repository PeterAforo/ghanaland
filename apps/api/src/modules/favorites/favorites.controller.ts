import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';

@ApiTags('Favorites')
@Controller('favorites')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
export class FavoritesController {
  constructor(private favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Get user favorites' })
  async getUserFavorites(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.favoritesService.getUserFavorites(
      req.user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Post(':listingId')
  @ApiOperation({ summary: 'Add listing to favorites' })
  async addFavorite(@Request() req: any, @Param('listingId') listingId: string) {
    return this.favoritesService.addFavorite(req.user.id, listingId);
  }

  @Delete(':listingId')
  @ApiOperation({ summary: 'Remove listing from favorites' })
  async removeFavorite(@Request() req: any, @Param('listingId') listingId: string) {
    return this.favoritesService.removeFavorite(req.user.id, listingId);
  }

  @Get('check/:listingId')
  @ApiOperation({ summary: 'Check if listing is favorited' })
  async checkFavorite(@Request() req: any, @Param('listingId') listingId: string) {
    return this.favoritesService.checkFavorite(req.user.id, listingId);
  }

  @Post('check-multiple')
  @ApiOperation({ summary: 'Check multiple listings favorite status' })
  async checkMultipleFavorites(
    @Request() req: any,
    @Body() body: { listingIds: string[] },
  ) {
    return this.favoritesService.checkMultipleFavorites(req.user.id, body.listingIds);
  }
}
