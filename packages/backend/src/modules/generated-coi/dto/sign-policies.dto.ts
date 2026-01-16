import { IsString, IsOptional, IsUrl } from 'class-validator';

export class SignPoliciesDto {
  @IsOptional()
  @IsUrl()
  signatureGlUrl?: string;

  @IsOptional()
  @IsUrl()
  signatureUmbrellaUrl?: string;

  @IsOptional()
  @IsUrl()
  signatureAutoUrl?: string;

  @IsOptional()
  @IsUrl()
  signatureWcUrl?: string;
}
