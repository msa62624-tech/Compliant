import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'Downtown Office Building' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'New commercial office building construction', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2024-01-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate: Date;

  @ApiProperty({ example: '2024-12-31', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: Date;
}
