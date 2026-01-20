import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardFilterDto } from '../../common/dto/dashboard-filter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '@prisma/client';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('items')
  @ApiOperation({ summary: 'Get filtered dashboard items' })
  @ApiResponse({ status: 200, description: 'Returns filtered dashboard items' })
  async getDashboardItems(
    @GetUser() user: User,
    @Query() filters: DashboardFilterDto,
  ) {
    return this.dashboardService.getDashboardItems(user.id, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Returns dashboard stats' })
  async getDashboardStats(@GetUser() user: User) {
    return this.dashboardService.getDashboardStats(user.id);
  }
}
