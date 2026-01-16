import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DeficienciesService } from './deficiencies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDeficiencyDto, ResolveDeficiencyDto } from './dto/deficiency.dto';

@ApiTags('deficiencies')
@Controller('deficiencies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DeficienciesController {
  constructor(private readonly deficienciesService: DeficienciesService) {}

  @Post()
  async createDeficiency(@Body() dto: CreateDeficiencyDto) {
    return this.deficienciesService.createDeficiency(
      dto.reviewId,
      dto.category,
      dto.severity,
      dto.description,
      dto.requiredAction,
      new Date(dto.dueDate),
    );
  }

  @Patch(':id/resolve')
  async resolveDeficiency(
    @Param('id') id: string,
    @Body() dto: ResolveDeficiencyDto,
    @Request() req,
  ) {
    return this.deficienciesService.resolveDeficiency(id, req.user.userId, dto.resolutionNotes);
  }

  @Get()
  async getDeficiencies(@Query('reviewId') reviewId?: string, @Query('status') status?: string) {
    return this.deficienciesService.getDeficiencies(reviewId, status);
  }

  @Get('templates')
  getTemplates() {
    return this.deficienciesService.getTemplates();
  }

  @Get('overdue')
  async getOverdueDeficiencies() {
    return this.deficienciesService.getOverdueDeficiencies();
  }

  @Post(':id/reminder')
  async sendReminder(@Param('id') id: string, @Body('userId') userId: string) {
    return this.deficienciesService.sendReminder(id, userId);
  }
}
