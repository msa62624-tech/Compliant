import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UploadPoliciesDto {
  @IsOptional()
  @IsUrl()
  glPolicyUrl?: string;

  @IsOptional()
  @IsUrl()
  umbrellaPolicyUrl?: string;

  @IsOptional()
  @IsUrl()
  autoPolicyUrl?: string;

  @IsOptional()
  @IsUrl()
  wcPolicyUrl?: string;
}
