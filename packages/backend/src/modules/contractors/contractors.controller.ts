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
import { Throttle } from '@nestjs/throttler';
import { ContractorsService } from './contractors.service';
import { CreateContractorDto } from './dto/create-contractor.dto';
import { UpdateContractorDto } from './dto/update-contractor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

// Rate limiting: 100 requests per minute for read operations
const READ_THROTTLE = { default: { limit: 100, ttl: 60000 } };

// Rate limiting: 20 requests per minute for write operations
const WRITE_THROTTLE = { default: { limit: 20, ttl: 60000 } };

@ApiTags('Contractors')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('contractors')
export class ContractorsController {
  constructor(private readonly contractorsService: ContractorsService) {}

  @Post()
  @Throttle(WRITE_THROTTLE)
  @ApiOperation({ summary: 'Create a new contractor' })
  @ApiResponse({ status: 201, description: 'Contractor created successfully' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  create(@Body() createContractorDto: CreateContractorDto, @GetUser('id') userId: string) {
    return this.contractorsService.create(createContractorDto, userId);
  }

  @Get()
  @Throttle(READ_THROTTLE)
  @ApiOperation({ summary: 'Get all contractors' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Contractors retrieved successfully' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.contractorsService.findAll(page, limit, status);
  }

  @Get(':id')
  @Throttle(READ_THROTTLE)
  @ApiOperation({ summary: 'Get contractor by ID' })
  @ApiResponse({ status: 200, description: 'Contractor retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  findOne(@Param('id') id: string) {
    return this.contractorsService.findOne(id);
  }

  @Get(':id/insurance-status')
  @Throttle(READ_THROTTLE)
  @ApiOperation({ summary: 'Get contractor insurance status' })
  @ApiResponse({ status: 200, description: 'Insurance status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  getInsuranceStatus(@Param('id') id: string) {
    return this.contractorsService.getInsuranceStatus(id);
  }

  @Patch(':id')
  @Throttle(WRITE_THROTTLE)
  @ApiOperation({ summary: 'Update contractor' })
  @ApiResponse({ status: 200, description: 'Contractor updated successfully' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  update(@Param('id') id: string, @Body() updateContractorDto: UpdateContractorDto) {
    return this.contractorsService.update(id, updateContractorDto);
  }

  @Delete(':id')
  @Throttle(WRITE_THROTTLE)
  @ApiOperation({ summary: 'Delete contractor' })
  @ApiResponse({ status: 200, description: 'Contractor deleted successfully' })
  @ApiResponse({ status: 404, description: 'Contractor not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  remove(@Param('id') id: string) {
    return this.contractorsService.remove(id);
  }
}
