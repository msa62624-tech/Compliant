import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { HoldHarmlessService } from './hold-harmless.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole, HoldHarmlessStatus } from '@prisma/client';

@ApiTags('hold-harmless')
@Controller('hold-harmless')
export class HoldHarmlessController {
  constructor(private readonly holdHarmlessService: HoldHarmlessService) {}

  @Post('auto-generate/:coiId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Auto-generate hold harmless when COI is approved (internal use)' })
  @ApiResponse({ status: 201, description: 'Hold harmless generated and sent to subcontractor' })
  async autoGenerate(@Param('coiId') coiId: string) {
    return this.holdHarmlessService.autoGenerateOnCOIApproval(coiId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get hold harmless by ID (authenticated)' })
  @ApiResponse({ status: 200, description: 'Returns hold harmless details for signing' })
  async getById(@Param('id') id: string) {
    return this.holdHarmlessService.getById(id);
  }

  @Post(':id/sign/subcontractor')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUBCONTRACTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process subcontractor signature (authenticated)' })
  @ApiResponse({ status: 200, description: 'Subcontractor signature recorded, GC notified' })
  async signSubcontractor(
    @Param('id') id: string,
    @Body() signatureData: { signatureUrl: string; signedBy: string }
  ) {
    return this.holdHarmlessService.processSubcontractorSignature(id, signatureData);
  }

  @Post(':id/sign/gc')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CONTRACTOR, UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process GC signature (authenticated)' })
  @ApiResponse({ status: 200, description: 'GC signature recorded, hold harmless completed' })
  async signGC(
    @Param('id') id: string,
    @Body() signatureData: { signatureUrl: string; signedBy: string; finalDocUrl: string }
  ) {
    return this.holdHarmlessService.processGCSignature(id, signatureData);
  }

  @Get('coi/:coiId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get hold harmless agreement for a COI' })
  @ApiResponse({ status: 200, description: 'Returns hold harmless agreement' })
  async getHoldHarmless(@Param('coiId') coiId: string) {
    return this.holdHarmlessService.getHoldHarmless(coiId);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all hold harmless agreements' })
  @ApiQuery({ name: 'status', enum: HoldHarmlessStatus, required: false })
  @ApiQuery({ name: 'pendingSignature', type: Boolean, required: false })
  @ApiResponse({ status: 200, description: 'Returns list of hold harmless agreements' })
  async getAllHoldHarmless(
    @Query('status') status?: HoldHarmlessStatus,
    @Query('pendingSignature') pendingSignature?: boolean,
  ) {
    return this.holdHarmlessService.getAllHoldHarmless({
      status,
      pendingSignature: pendingSignature === true,
    });
  }

  @Post(':id/resend/:party')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend signature link to SUB or GC' })
  @ApiResponse({ status: 200, description: 'Signature link resent' })
  async resendSignatureLink(
    @Param('id') id: string,
    @Param('party') party: 'SUB' | 'GC',
  ) {
    return this.holdHarmlessService.resendSignatureLink(id, party);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get hold harmless statistics' })
  @ApiResponse({ status: 200, description: 'Returns statistics' })
  async getStatistics() {
    return this.holdHarmlessService.getStatistics();
  }
}
