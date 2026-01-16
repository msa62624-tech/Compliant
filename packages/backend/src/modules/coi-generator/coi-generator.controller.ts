import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { COIGeneratorService } from './coi-generator.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateCOIDto } from './dto/generate-coi.dto';

@ApiTags('coi-generator')
@Controller('coi-generator')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class COIGeneratorController {
  constructor(private readonly coiGeneratorService: COIGeneratorService) {}

  @Post('generate')
  async generateCOI(@Body() dto: GenerateCOIDto, @Request() req) {
    return this.coiGeneratorService.generateCOI(dto, req.user.userId);
  }

  @Get()
  async getCOIs(@Query('contractorId') contractorId?: string, @Query('status') status?: string) {
    return this.coiGeneratorService.getCOIs(contractorId, status);
  }

  @Get('expiring')
  async getExpiringCOIs(@Query('days') days?: string) {
    const daysAhead = days ? parseInt(days, 10) : 30;
    return this.coiGeneratorService.getExpiringCOIs(daysAhead);
  }

  @Get(':id')
  async getCOI(@Param('id') id: string) {
    return this.coiGeneratorService.getCOI(id);
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.coiGeneratorService.updateCOIStatus(id, status);
  }

  @Post(':id/approve')
  async approveCOI(@Param('id') id: string, @Body('approvalId') approvalId: string) {
    return this.coiGeneratorService.approveCOI(id, approvalId);
  }

  @Post(':id/reject')
  async rejectCOI(@Param('id') id: string, @Body('reason') reason: string) {
    return this.coiGeneratorService.rejectCOI(id, reason);
  }
}
