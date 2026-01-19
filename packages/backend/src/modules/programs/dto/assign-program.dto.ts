import { IsString, IsOptional, IsObject } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AssignProgramDto {
  @ApiProperty({ description: "Project ID to assign the program to" })
  @IsString()
  projectId: string;

  @ApiPropertyOptional({
    description: "Custom requirements override for this project",
    type: "object",
    additionalProperties: true,
  })
  @IsObject()
  @IsOptional()
  customRequirements?: Record<string, unknown>;
}
