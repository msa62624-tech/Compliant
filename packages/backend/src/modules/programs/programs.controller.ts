import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import { Request as ExpressRequest } from "express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { ProgramsService } from "./programs.service";
import { CreateProgramDto } from "./dto/create-program.dto";
import { UpdateProgramDto } from "./dto/update-program.dto";
import { AssignProgramDto } from "./dto/assign-program.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { UserRole } from "@prisma/client";

@ApiTags("Insurance Programs")
@ApiBearerAuth()
@Controller("programs")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Create a new insurance program template" })
  @ApiResponse({ status: 201, description: "Program created successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin or Super Admin role required",
  })
  create(
    @Body() createProgramDto: CreateProgramDto,
    @Request() req: ExpressRequest,
  ) {
    return this.programsService.create(createProgramDto, req.user!.id);
  }

  @Get()
  @ApiOperation({ summary: "Get all insurance programs" })
  @ApiQuery({
    name: "isTemplate",
    required: false,
    type: Boolean,
    description: "Filter by template status",
  })
  @ApiResponse({ status: 200, description: "Programs retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  findAll(@Query("isTemplate") isTemplate?: string) {
    const isTemplateBoolean =
      isTemplate === "true" ? true : isTemplate === "false" ? false : undefined;
    return this.programsService.findAll(isTemplateBoolean);
  }

  @Get("stats")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Get insurance program statistics" })
  @ApiResponse({
    status: 200,
    description: "Statistics retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin or Super Admin role required",
  })
  getStatistics() {
    return this.programsService.getStatistics();
  }

  @Get("project/:projectId")
  @ApiOperation({ summary: "Get all programs assigned to a specific project" })
  @ApiResponse({
    status: 200,
    description: "Project programs retrieved successfully",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Project not found" })
  findByProject(@Param("projectId") projectId: string) {
    return this.programsService.findByProject(projectId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get an insurance program by ID" })
  @ApiResponse({ status: 200, description: "Program retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Program not found" })
  findOne(@Param("id") id: string) {
    return this.programsService.findOne(id);
  }

  @Patch(":id")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Update an insurance program" })
  @ApiResponse({ status: 200, description: "Program updated successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin or Super Admin role required",
  })
  @ApiResponse({ status: 404, description: "Program not found" })
  update(@Param("id") id: string, @Body() updateProgramDto: UpdateProgramDto) {
    return this.programsService.update(id, updateProgramDto);
  }

  @Delete(":id")
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Delete an insurance program" })
  @ApiResponse({ status: 200, description: "Program deleted successfully" })
  @ApiResponse({
    status: 400,
    description: "Cannot delete program with active assignments",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Super Admin role required",
  })
  @ApiResponse({ status: 404, description: "Program not found" })
  remove(@Param("id") id: string) {
    return this.programsService.remove(id);
  }

  @Post(":id/assign-project")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: "Assign an insurance program to a project" })
  @ApiResponse({
    status: 201,
    description: "Program assigned to project successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Program already assigned to project",
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({
    status: 403,
    description: "Forbidden - Admin or Super Admin role required",
  })
  @ApiResponse({ status: 404, description: "Program or Project not found" })
  assignToProject(
    @Param("id") id: string,
    @Body() assignProgramDto: AssignProgramDto,
    @Request() req: ExpressRequest,
  ) {
    return this.programsService.assignToProject(
      id,
      assignProgramDto,
      req.user!.id,
    );
  }
}
