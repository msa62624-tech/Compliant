import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AssignContractorDto } from './dto/assign-contractor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('Projects')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created successfully' })
  create(@Body() createProjectDto: CreateProjectDto, @GetUser('id') userId: string) {
    return this.projectsService.create(createProjectDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Projects retrieved successfully' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.projectsService.findAll(page, limit, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({ status: 200, description: 'Project retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Get(':id/contractors')
  @ApiOperation({ summary: 'Get project contractors' })
  @ApiResponse({ status: 200, description: 'Contractors retrieved successfully' })
  getContractors(@Param('id') id: string) {
    return this.projectsService.getProjectContractors(id);
  }

  @Post(':id/contractors')
  @ApiOperation({ summary: 'Assign contractor to project' })
  @ApiResponse({ status: 201, description: 'Contractor assigned successfully' })
  assignContractor(@Param('id') id: string, @Body() assignContractorDto: AssignContractorDto) {
    return this.projectsService.assignContractor(id, assignContractorDto);
  }

  @Delete(':id/contractors/:contractorId')
  @ApiOperation({ summary: 'Remove contractor from project' })
  @ApiResponse({ status: 200, description: 'Contractor removed successfully' })
  removeContractor(@Param('id') id: string, @Param('contractorId') contractorId: string) {
    return this.projectsService.removeContractor(id, contractorId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project' })
  @ApiResponse({ status: 200, description: 'Project updated successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project' })
  @ApiResponse({ status: 200, description: 'Project deleted successfully' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }
}
