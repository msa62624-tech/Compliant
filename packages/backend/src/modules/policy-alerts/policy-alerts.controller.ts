import { Controller, Get, Post, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PolicyAlertsService } from './policy-alerts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('policy-alerts')
@Controller('policy-alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PolicyAlertsController {
  constructor(private readonly policyAlertsService: PolicyAlertsService) {}

  @Get()
  async getExpiringPolicies(
    @Query('contractorId') contractorId?: string,
    @Query('resolved') resolved?: string,
  ) {
    const resolvedBool = resolved === 'true' ? true : resolved === 'false' ? false : undefined;
    return this.policyAlertsService.getExpiringPolicies(contractorId, resolvedBool);
  }

  @Get('summary')
  async getAlertSummary(@Query('contractorId') contractorId?: string) {
    return this.policyAlertsService.getAlertSummary(contractorId);
  }

  @Post('check')
  async checkExpiringPolicies() {
    await this.policyAlertsService.checkExpiringPolicies();
    return { message: 'Policy check completed' };
  }

  @Patch(':id/resolve')
  async resolveAlert(@Param('id') id: string) {
    return this.policyAlertsService.resolveAlert(id);
  }
}
