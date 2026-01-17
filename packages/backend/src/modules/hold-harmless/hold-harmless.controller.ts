import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { UploadHoldHarmlessDto } from './dto/upload-hold-harmless.dto';
import { ReviewHoldHarmlessDto } from './dto/review-hold-harmless.dto';

@ApiTags('hold-harmless')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hold-harmless')
export class HoldHarmlessController {
  constructor(private readonly holdHarmlessService: HoldHarmlessService) {}

  @Post('coi/:coiId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.BROKER)
  @ApiOperation({ summary: 'Upload hold harmless document for a COI' })
  @ApiResponse({ status: 201, description: 'Hold harmless uploaded successfully' })
  async uploadHoldHarmless(
    @Param('coiId') coiId: string,
    @Body() uploadDto: UploadHoldHarmlessDto,
  ) {
    return this.holdHarmlessService.uploadHoldHarmless(
      coiId,
      uploadDto.documentUrl,
      uploadDto.uploadedBy,
      {
        agreementType: uploadDto.agreementType,
        parties: uploadDto.parties,
        effectiveDate: uploadDto.effectiveDate ? new Date(uploadDto.effectiveDate) : undefined,
        expirationDate: uploadDto.expirationDate ? new Date(uploadDto.expirationDate) : undefined,
      },
    );
  }

  @Get('coi/:coiId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.BROKER)
  @ApiOperation({ summary: 'Get hold harmless agreement for a COI' })
  @ApiResponse({ status: 200, description: 'Returns hold harmless agreement' })
  async getHoldHarmless(@Param('coiId') coiId: string) {
    return this.holdHarmlessService.getHoldHarmless(coiId);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get all hold harmless agreements' })
  @ApiQuery({ name: 'status', enum: HoldHarmlessStatus, required: false })
  @ApiQuery({ name: 'expired', type: Boolean, required: false })
  @ApiQuery({ name: 'needsReview', type: Boolean, required: false })
  @ApiResponse({ status: 200, description: 'Returns list of hold harmless agreements' })
  async getAllHoldHarmless(
    @Query('status') status?: HoldHarmlessStatus,
    @Query('expired') expired?: boolean,
    @Query('needsReview') needsReview?: boolean,
  ) {
    return this.holdHarmlessService.getAllHoldHarmless({
      status,
      expired: expired === true,
      needsReview: needsReview === true,
    });
  }

  @Patch(':id/review')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Review and approve/reject hold harmless agreement' })
  @ApiResponse({ status: 200, description: 'Hold harmless reviewed successfully' })
  async reviewHoldHarmless(
    @Param('id') id: string,
    @Body() reviewDto: ReviewHoldHarmlessDto,
  ) {
    return this.holdHarmlessService.reviewHoldHarmless(
      id,
      reviewDto.reviewedBy,
      reviewDto.status,
      reviewDto.reviewNotes,
      reviewDto.meetsRequirements,
      reviewDto.deficiencies,
    );
  }

  @Get('expiring')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get hold harmless agreements expiring soon' })
  @ApiQuery({ name: 'days', type: Number, required: false, description: 'Days threshold (default: 30)' })
  @ApiResponse({ status: 200, description: 'Returns list of expiring hold harmless agreements' })
  async getExpiringHoldHarmless(@Query('days') days?: number) {
    return this.holdHarmlessService.checkExpiringHoldHarmless(days ? Number(days) : 30);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get hold harmless statistics' })
  @ApiResponse({ status: 200, description: 'Returns statistics' })
  async getStatistics() {
    return this.holdHarmlessService.getStatistics();
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete hold harmless agreement' })
  @ApiResponse({ status: 200, description: 'Hold harmless deleted successfully' })
  async deleteHoldHarmless(@Param('id') id: string) {
    return this.holdHarmlessService.deleteHoldHarmless(id);
  }
}
