import { IsString, IsEnum, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitReviewDto {
  @ApiProperty({ description: 'Contractor ID' })
  @IsString()
  contractorId: string;

  @ApiProperty({ description: 'Document/File ID' })
  @IsString()
  documentId: string;

  @ApiProperty({ description: 'Priority level', required: false })
  @IsOptional()
  @IsEnum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  priority?: string;

  @ApiProperty({ description: 'Due date', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}

export class ReviewDecisionDto {
  @ApiProperty({ description: 'Review decision' })
  @IsEnum(['APPROVED', 'REJECTED', 'CONDITIONAL_APPROVAL'])
  decision: string;

  @ApiProperty({ description: 'Review notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class AssignReviewerDto {
  @ApiProperty({ description: 'Reviewer user ID' })
  @IsString()
  reviewerId: string;
}
