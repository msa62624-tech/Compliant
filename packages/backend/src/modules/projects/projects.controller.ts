import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import { Request as ExpressRequest } from "express";
import { ApiTags, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { ProjectsService } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Projects")
@Controller("projects")
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new project" })
  create(
    @Body() createProjectDto: CreateProjectDto,
    @Request() req: ExpressRequest,
  ) {
    return this.projectsService.create(createProjectDto, req.user!.id);
  }

  @Get()
  @ApiOperation({
    summary: "Get all projects (filtered by user role) with search",
  })
  @ApiQuery({
    name: "search",
    required: false,
    type: String,
    description: "Search by name, address, or GC name",
  })
  @ApiQuery({
    name: "status",
    required: false,
    type: String,
    description: "Filter by project status",
  })
  findAll(
    @Request() req: ExpressRequest,
    @Query("search") search?: string,
    @Query("status") status?: string,
  ) {
    // Pass full user object and search parameters for role-based filtering
    return this.projectsService.findAll(req.user!, search, status);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get project by ID" })
  findOne(@Param("id") id: string) {
    return this.projectsService.findOne(id);
  }

  @Get("contractor/:contractorId")
  @ApiOperation({ summary: "Get projects by contractor ID" })
  findByContractor(@Param("contractorId") contractorId: string) {
    return this.projectsService.findByContractor(contractorId);
  }
}
