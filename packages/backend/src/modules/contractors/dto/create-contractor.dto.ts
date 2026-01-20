import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SanitizeHtml } from "../../../common/sanitizers/string-sanitizer";
import { ContractorStatus } from "@prisma/client";

export class CreateContractorDto {
  @ApiProperty({ example: "John Doe Construction" })
  @SanitizeHtml()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "contractor@example.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: "+1-555-0123" })
  @SanitizeHtml()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: "ABC Construction LLC" })
  @SanitizeHtml()
  @IsString()
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({ example: "670 Myrtle Ave, Suite 163" })
  @SanitizeHtml()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: "Brooklyn" })
  @SanitizeHtml()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: "NY" })
  @SanitizeHtml()
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: "11205" })
  @SanitizeHtml()
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiPropertyOptional({
    example: ["General Contracting", "Construction Management"],
    description: "List of trades/specialties",
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  trades?: string[];

  @ApiPropertyOptional({
    example: "ACTIVE",
    enum: ContractorStatus,
    description: "Status of the contractor",
  })
  @IsEnum(ContractorStatus)
  @IsOptional()
  status?: ContractorStatus;
}
