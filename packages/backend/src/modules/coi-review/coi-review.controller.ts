import { Controller, Post, Get, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { COIReviewService } from './coi-review.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubmitReviewDto, ReviewDecisionDto, AssignReviewerDto } from './dto/review.dto';

@ApiTags('coi-review')
@Controller('coi-review')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class COIReviewController {
  constructor(private readonly reviewService: COIReviewService) {}

  @Post('submit')
  async submitReview(@Body() dto: SubmitReviewDto, @Request() req) {
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    return this.reviewService.submitReview(
      dto.contractorId,
      dto.documentId,
      req.user.userId,
      dto.priority,
      dueDate,
    );
  }

  @Patch(':id/assign')
  async assignReviewer(@Param('id') id: string, @Body() dto: AssignReviewerDto) {
    return this.reviewService.assignReviewer(id, dto.reviewerId);
  }

  @Patch(':id/decision')
  async submitDecision(
    @Param('id') id: string,
    @Body() dto: ReviewDecisionDto,
    @Request() req,
  ) {
    return this.reviewService.submitDecision(id, req.user.userId, dto.decision, dto.notes);
  }

  @Get('queue')
  async getReviewQueue(@Query('reviewerId') reviewerId?: string, @Query('status') status?: string) {
    return this.reviewService.getReviewQueue(reviewerId, status);
  }

  @Get('overdue')
  async getOverdueReviews() {
    return this.reviewService.getOverdueReviews();
  }

  @Get(':id')
  async getReview(@Param('id') id: string) {
    return this.reviewService.getReview(id);
  }
}
