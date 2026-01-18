import { IsString, IsOptional } from "class-validator";
import { IsSafeUrl } from "../../../common/validators/safe-url.validator";

export class SignPoliciesDto {
  @IsOptional()
  @IsString()
  @IsSafeUrl()
  glBrokerSignatureUrl?: string;

  @IsOptional()
  @IsString()
  @IsSafeUrl()
  umbrellaBrokerSignatureUrl?: string;

  @IsOptional()
  @IsString()
  @IsSafeUrl()
  autoBrokerSignatureUrl?: string;

  @IsOptional()
  @IsString()
  @IsSafeUrl()
  wcBrokerSignatureUrl?: string;
}
