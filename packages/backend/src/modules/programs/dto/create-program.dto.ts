import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsObject,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateProgramDto {
  @ApiProperty({ description: "Program name" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: "Program description" })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: "Whether this is a template",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isTemplate?: boolean;

  @ApiPropertyOptional({ description: "General Liability minimum coverage" })
  @IsNumber()
  @IsOptional()
  glMinimum?: number;

  @ApiPropertyOptional({ description: "Workers Comp minimum coverage" })
  @IsNumber()
  @IsOptional()
  wcMinimum?: number;

  @ApiPropertyOptional({ description: "Auto Liability minimum coverage" })
  @IsNumber()
  @IsOptional()
  autoMinimum?: number;

  @ApiPropertyOptional({ description: "Umbrella minimum coverage" })
  @IsNumber()
  @IsOptional()
  umbrellaMinimum?: number;

  @ApiPropertyOptional({
    description: "Requires Hold Harmless agreement",
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  requiresHoldHarmless?: boolean;

  @ApiPropertyOptional({
    description: "URL to hold harmless template document",
  })
  @IsString()
  @IsOptional()
  holdHarmlessTemplateUrl?: string;

  @ApiPropertyOptional({
    description: "Requires Additional Insured",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  requiresAdditionalInsured?: boolean;

  @ApiPropertyOptional({
    description: "Requires Waiver of Subrogation",
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  requiresWaiverSubrogation?: boolean;

  @ApiPropertyOptional({
    description: "Tier-based requirements",
    type: "object",
  })
  @IsObject()
  @IsOptional()
  tierRequirements?: Record<string, any>;

  @ApiPropertyOptional({
    description: "Trade-specific requirements",
    type: "object",
  })
  @IsObject()
  @IsOptional()
  tradeRequirements?: Record<string, any>;

  @ApiPropertyOptional({ description: "Auto-approval rules", type: "object" })
  @IsObject()
  @IsOptional()
  autoApprovalRules?: Record<string, any>;
}
