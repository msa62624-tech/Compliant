import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ReviewCOIDto {
  @IsBoolean()
  approved: boolean;

  @IsOptional()
  @IsString()
  deficiencyNotes?: string;

  @IsOptional()
  @IsBoolean()
  holdHarmlessCompliant?: boolean;

  @IsOptional()
  @IsString()
  holdHarmlessNotes?: string;
}
