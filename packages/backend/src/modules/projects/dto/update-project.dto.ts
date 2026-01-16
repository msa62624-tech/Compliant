import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProjectStatus } from '@compliant/shared';

export class UpdateProjectDto {
  @ApiProperty({ example: 'Downtown Office Building', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Updated description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2024-01-01', required: false })
  @IsDateString()
  @IsOptional()
  startDate?: Date;

  @ApiProperty({ example: '2024-12-31', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: Date;

  @ApiProperty({ example: 'ACTIVE', enum: ProjectStatus, required: false })
  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;
}
