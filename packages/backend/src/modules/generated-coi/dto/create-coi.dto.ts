import { IsString, IsOptional, IsEmail } from "class-validator";

export class CreateCOIDto {
  @IsString()
  projectId: string;

  @IsString()
  subcontractorId: string;

  @IsOptional()
  @IsEmail()
  assignedAdminEmail?: string;
}
