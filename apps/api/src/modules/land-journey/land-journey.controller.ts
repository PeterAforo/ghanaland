import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LandJourneyService } from './land-journey.service';
import {
  CreateUserLandDto,
  UpdateUserLandDto,
  UpdateStageStatusDto,
  AddLandDocumentDto,
  LandJourneyStage,
} from './dto';

@ApiTags('Land Journey')
@Controller('land-journey')
export class LandJourneyController {
  constructor(private readonly landJourneyService: LandJourneyService) {}

  // ============================================================================
  // STAGE CONFIGURATION
  // ============================================================================

  @Get('stages/config')
  @ApiOperation({ summary: 'Get journey stage configuration' })
  async getStageConfig() {
    return this.landJourneyService.getStageConfig();
  }

  @Get('stages/:stage/professionals')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get professionals for a specific stage' })
  async getProfessionalsForStage(@Param('stage') stage: LandJourneyStage) {
    return this.landJourneyService.getProfessionalsForStage(stage);
  }

  // ============================================================================
  // USER LANDS
  // ============================================================================

  @Get('my-lands')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all lands for current user' })
  async getMyLands(@Request() req: any) {
    return this.landJourneyService.getUserLands(req.user.id);
  }

  @Get('unlinked-transactions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get completed transactions without a linked land' })
  async getUnlinkedTransactions(@Request() req: any) {
    return this.landJourneyService.getUnlinkedTransactions(req.user.id);
  }

  @Post('from-transaction/:transactionId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create land from an existing completed transaction' })
  async createLandFromTransaction(
    @Request() req: any,
    @Param('transactionId') transactionId: string,
  ) {
    return this.landJourneyService.createLandFromTransaction(req.user.id, transactionId);
  }

  @Get('lands/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get land details with full journey' })
  async getLandById(@Request() req: any, @Param('id') id: string) {
    return this.landJourneyService.getLandById(id, req.user.id);
  }

  @Post('lands')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new land (manually or from transaction)' })
  async createLand(@Request() req: any, @Body() dto: CreateUserLandDto) {
    return this.landJourneyService.createLand(req.user.id, dto);
  }

  @Patch('lands/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update land details' })
  async updateLand(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateUserLandDto,
  ) {
    return this.landJourneyService.updateLand(id, req.user.id, dto);
  }

  @Delete('lands/:id')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a land' })
  async deleteLand(@Request() req: any, @Param('id') id: string) {
    return this.landJourneyService.deleteLand(id, req.user.id);
  }

  // ============================================================================
  // JOURNEY STAGES
  // ============================================================================

  @Patch('lands/:landId/stages/:stage')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update stage status' })
  async updateStageStatus(
    @Request() req: any,
    @Param('landId') landId: string,
    @Param('stage') stage: LandJourneyStage,
    @Body() dto: UpdateStageStatusDto,
  ) {
    return this.landJourneyService.updateStageStatus(landId, stage, req.user.id, dto);
  }

  @Post('lands/:landId/stages/:stage/link-request')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Link a service request to a journey stage' })
  async linkServiceRequest(
    @Request() req: any,
    @Param('landId') landId: string,
    @Param('stage') stage: LandJourneyStage,
    @Body() body: { serviceRequestId: string },
  ) {
    return this.landJourneyService.linkServiceRequest(
      landId,
      stage,
      body.serviceRequestId,
      req.user.id,
    );
  }

  // ============================================================================
  // DOCUMENTS
  // ============================================================================

  @Post('lands/:landId/documents')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a document to land' })
  async addDocument(
    @Request() req: any,
    @Param('landId') landId: string,
    @Body() dto: AddLandDocumentDto,
  ) {
    return this.landJourneyService.addDocument(landId, req.user.id, dto);
  }

  @Delete('lands/:landId/documents/:documentId')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a document' })
  async deleteDocument(
    @Request() req: any,
    @Param('landId') landId: string,
    @Param('documentId') documentId: string,
  ) {
    return this.landJourneyService.deleteDocument(landId, documentId, req.user.id);
  }
}
