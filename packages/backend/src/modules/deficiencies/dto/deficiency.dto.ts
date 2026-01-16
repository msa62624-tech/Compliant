import { IsString, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeficiencyDto {
  @ApiProperty({ description: 'Review ID' })
  @IsString()
  reviewId: string;

  @ApiProperty({ description: 'Deficiency category' })
  @IsEnum(['COVERAGE_AMOUNT', 'EXPIRED_POLICY', 'MISSING_ENDORSEMENT', 'INCORRECT_NAMED_INSURED', 'MISSING_ADDITIONAL_INSURED', 'CERTIFICATE_HOLDER', 'OTHER'])
  category: string;

  @ApiProperty({ description: 'Severity level' })
  @IsEnum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
  severity: string;

  @ApiProperty({ description: 'Description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Required action' })
  @IsString()
  requiredAction: string;

  @ApiProperty({ description: 'Due date' })
  @IsDateString()
  dueDate: string;
}

export class ResolveDeficiencyDto {
  @ApiProperty({ description: 'Resolution notes' })
  @IsString()
  resolutionNotes: string;
}
