import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString } from 'class-validator';

export enum FilterType {
  GC = 'gc',
  PROJECT = 'project',
  COI = 'coi',
  COMPLIANCE = 'compliance',
  ALL = 'all',
}

export class DashboardFilterDto {
  @ApiPropertyOptional({ enum: FilterType, default: FilterType.ALL })
  @IsOptional()
  @IsEnum(FilterType)
  type?: FilterType = FilterType.ALL;

  @ApiPropertyOptional({ description: 'Search term for filtering items' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
