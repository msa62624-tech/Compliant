import { IsString, IsOptional, IsArray, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UploadHoldHarmlessDto {
  @ApiProperty({ description: 'URL of the uploaded hold harmless document' })
  @IsString()
  documentUrl: string;

  @ApiProperty({ description: 'Email of the person uploading the document' })
  @IsString()
  uploadedBy: string;

  @ApiPropertyOptional({ description: 'Type of agreement (Indemnification, Waiver, Combined)' })
  @IsOptional()
  @IsString()
  agreementType?: string;

  @ApiPropertyOptional({ description: 'List of parties involved in the agreement' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  parties?: string[];

  @ApiPropertyOptional({ description: 'Effective date of the agreement' })
  @IsOptional()
  @IsDateString()
  effectiveDate?: string;

  @ApiPropertyOptional({ description: 'Expiration date of the agreement' })
  @IsOptional()
  @IsDateString()
  expirationDate?: string;
}
