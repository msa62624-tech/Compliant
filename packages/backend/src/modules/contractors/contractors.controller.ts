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
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContractorsService } from './contractors.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@ApiTags('Contractors')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('contractors')
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new contractor' })
  @ApiResponse({ status: 201, description: 'Contractor created successfully' })
  create(@Body() createContractorDto: CreateContractorDto, @GetUser('id') userId: string) {
    return this.contractorsService.create(createContractorDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all contractors' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Contractors retrieved successfully' })
  @ApiResponse({ status: 400, description: 'Invalid pagination parameters' })
  findAll(
    @Query('page') page?: string,  // Query params are always strings from HTTP requests
    @Query('limit') limit?: string,  // Query params are always strings from HTTP requests
    @Query('status') status?: string,
  ) {
    // Validate and convert pagination parameters
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;

    // Validate that conversion was successful and values are positive
    if (isNaN(pageNum) || pageNum < 1) {
      throw new BadRequestException('Invalid page parameter: must be a positive number');
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      throw new BadRequestException('Invalid limit parameter: must be a positive number between 1 and 100');
    }

    return this.contractorsService.findAll(pageNum, limitNum, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contractor by ID' })
  @ApiResponse({ status: 200, description: 'Contractor retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  findOne(@Param('id') id: string) {
    return this.contractorsService.findOne(id);
  }

  @Get(':id/insurance-status')
  @ApiOperation({ summary: 'Get contractor insurance status' })
  @ApiResponse({ status: 200, description: 'Insurance status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  getInsuranceStatus(@Param('id') id: string) {
    return this.contractorsService.getInsuranceStatus(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update contractor' })
  @ApiResponse({ status: 200, description: 'Contractor updated successfully' })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  update(@Param('id') id: string, @Body() updateContractorDto: UpdateContractorDto) {
    return this.contractorsService.update(id, updateContractorDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete contractor' })
  @ApiResponse({ status: 200, description: 'Contractor deleted successfully' })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  remove(@Param('id') id: string) {
    return this.contractorsService.remove(id);
  }
}
