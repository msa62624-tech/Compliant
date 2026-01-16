import { IsString, IsOptional, IsUrl } from 'class-validator';

export class UploadPoliciesDto {
  @IsOptional()
  @IsUrl()
  policyGlUrl?: string;

  @IsOptional()
  @IsUrl()
  policyUmbrellaUrl?: string;

  @IsOptional()
  @IsUrl()
  policyAutoUrl?: string;

  @IsOptional()
  @IsUrl()
  policyWcUrl?: string;
}
