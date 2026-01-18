import { IsString, IsOptional } from "class-validator";
import { IsSafeUrl } from "../../../common/validators/safe-url.validator";

export class UploadPoliciesDto {
  @IsOptional()
  @IsString()
  @IsSafeUrl()
  glPolicyUrl?: string;

  @IsOptional()
  @IsString()
  @IsSafeUrl()
  umbrellaPolicyUrl?: string;

  @IsOptional()
  @IsString()
  @IsSafeUrl()
  autoPolicyUrl?: string;

  @IsOptional()
  @IsString()
  @IsSafeUrl()
  wcPolicyUrl?: string;
}
