import { IsBoolean, IsOptional, IsString } from "class-validator";

export class ReviewCOIDto {
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsString()
  deficiencyNotes?: string;
}
