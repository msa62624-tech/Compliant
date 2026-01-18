import { IsString, IsOptional, IsEmail, IsEnum } from "class-validator";
import { SanitizeHtml } from "../../../common/sanitizers/string-sanitizer";

export enum BrokerType {
  GLOBAL = "GLOBAL",
  PER_POLICY = "PER_POLICY",
}

export class UpdateBrokerInfoDto {
  @IsEnum(BrokerType)
  brokerType: BrokerType;

  // Global broker fields
  @IsOptional()
  @SanitizeHtml()
  @IsString()
  brokerName?: string;

  @IsOptional()
  @IsEmail()
  brokerEmail?: string;

  @IsOptional()
  @SanitizeHtml()
  @IsString()
  brokerPhone?: string;

  // Per-policy broker fields - GL
  @IsOptional()
  @SanitizeHtml()
  @IsString()
  brokerGlName?: string;

  @IsOptional()
  @IsEmail()
  brokerGlEmail?: string;

  @IsOptional()
  @SanitizeHtml()
  @IsString()
  brokerGlPhone?: string;

  // Per-policy broker fields - Umbrella
  @IsOptional()
  @SanitizeHtml()
  @IsString()
  brokerUmbrellaName?: string;

  @IsOptional()
  @IsEmail()
  brokerUmbrellaEmail?: string;

  @IsOptional()
  @SanitizeHtml()
  @IsString()
  brokerUmbrellaPhone?: string;

  // Per-policy broker fields - Auto
  @IsOptional()
  @SanitizeHtml()
  @IsString()
  brokerAutoName?: string;

  @IsOptional()
  @IsEmail()
  brokerAutoEmail?: string;

  @IsOptional()
  @SanitizeHtml()
  @IsString()
  brokerAutoPhone?: string;

  // Per-policy broker fields - WC
  @IsOptional()
  @SanitizeHtml()
  @IsString()
  brokerWcName?: string;

  @IsOptional()
  @IsEmail()
  brokerWcEmail?: string;

  @IsOptional()
  @SanitizeHtml()
  @IsString()
  brokerWcPhone?: string;
}
