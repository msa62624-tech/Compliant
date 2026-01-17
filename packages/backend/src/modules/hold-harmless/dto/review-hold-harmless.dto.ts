import { IsString, IsOptional, IsArray, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HoldHarmlessStatus } from '@prisma/client';

export class ReviewHoldHarmlessDto {
  @ApiProperty({ description: 'Email of the reviewer' })
  @IsString()
  reviewedBy: string;

  @ApiProperty({ enum: HoldHarmlessStatus, description: 'Review decision status' })
  @IsEnum(HoldHarmlessStatus)
  status: HoldHarmlessStatus;

  @ApiPropertyOptional({ description: 'Review notes or comments' })
  @IsOptional()
  @IsString()
  reviewNotes?: string;

  @ApiPropertyOptional({ description: 'Whether the agreement meets requirements' })
  @IsOptional()
  @IsBoolean()
  meetsRequirements?: boolean;

  @ApiPropertyOptional({ description: 'List of deficiencies if any' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deficiencies?: string[];
}
