import { IsString, IsOptional, IsUrl } from 'class-validator';

export class SignPoliciesDto {
  @IsOptional()
  @IsUrl()
  glBrokerSignatureUrl?: string;

  @IsOptional()
  @IsUrl()
  umbrellaBrokerSignatureUrl?: string;

  @IsOptional()
  @IsUrl()
  autoBrokerSignatureUrl?: string;

  @IsOptional()
  @IsUrl()
  wcBrokerSignatureUrl?: string;
}
