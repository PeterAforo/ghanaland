import { Controller, Get, Patch, Post, Body, UseGuards, Request, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Get('me/dashboard-stats')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get dashboard statistics for current user' })
  async getDashboardStats(@Request() req: any) {
    return this.usersService.getDashboardStats(req.user.id);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @Request() req: any,
    @Body() dto: { fullName?: string; phone?: string },
  ) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Patch('me/password')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password' })
  async changePassword(
    @Request() req: any,
    @Body() dto: { currentPassword: string; newPassword: string },
  ) {
    return this.usersService.changePassword(req.user.id, dto.currentPassword, dto.newPassword);
  }

  @Post('me/avatar')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
        cb(new BadRequestException('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
      } else {
        cb(null, true);
      }
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Profile photo (JPEG, PNG, GIF, WebP, max 5MB)',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload profile photo' })
  async uploadAvatar(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.usersService.uploadAvatar(req.user.id, file);
  }
}
