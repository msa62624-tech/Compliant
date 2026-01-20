import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GetUser } from "../../common/decorators/get-user.decorator";
import { User } from "@prisma/client";

@ApiTags("Dashboard")
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @ApiOperation({ summary: "Get dashboard data for current user" })
  @ApiResponse({
    status: 200,
    description: "Dashboard data retrieved successfully",
  })
  getDashboard(@GetUser() user: User) {
    return this.dashboardService.getDashboardData(user);
  }

  @Get("projects")
  @ApiOperation({ summary: "Get filtered projects with pagination" })
  @ApiQuery({ name: "status", required: false, type: String })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Projects retrieved successfully" })
  getProjects(
    @GetUser() user: User,
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.dashboardService.getFilteredProjects(
      user,
      status,
      search,
      page,
      limit,
    );
  }

  @Get("contractors")
  @ApiOperation({ summary: "Get filtered contractors with pagination" })
  @ApiQuery({ name: "status", required: false, type: String })
  @ApiQuery({ name: "insuranceStatus", required: false, type: String })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: "Contractors retrieved successfully",
  })
  getContractors(
    @GetUser() user: User,
    @Query("status") status?: string,
    @Query("insuranceStatus") insuranceStatus?: string,
    @Query("search") search?: string,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query("limit", new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.dashboardService.getFilteredContractors(
      user,
      status,
      insuranceStatus,
      search,
      page,
      limit,
    );
  }
}
