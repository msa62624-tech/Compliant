import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';

export enum BrokerType {
  GLOBAL = 'GLOBAL',
  PER_POLICY = 'PER_POLICY',
}

export class UpdateBrokerInfoDto {
  @IsEnum(BrokerType)
  brokerType: BrokerType;

  // Global broker fields
  @IsOptional()
  @IsString()
  brokerName?: string;

  @IsOptional()
  @IsEmail()
  brokerEmail?: string;

  @IsOptional()
  @IsString()
  brokerPhone?: string;

  // Per-policy broker fields - GL
  @IsOptional()
  @IsString()
  brokerGlName?: string;

  @IsOptional()
  @IsEmail()
  brokerGlEmail?: string;

  @IsOptional()
  @IsString()
  brokerGlPhone?: string;

  // Per-policy broker fields - Umbrella
  @IsOptional()
  @IsString()
  brokerUmbrellaName?: string;

  @IsOptional()
  @IsEmail()
  brokerUmbrellaEmail?: string;

  @IsOptional()
  @IsString()
  brokerUmbrellaPhone?: string;

  // Per-policy broker fields - Auto
  @IsOptional()
  @IsString()
  brokerAutoName?: string;

  @IsOptional()
  @IsEmail()
  brokerAutoEmail?: string;

  @IsOptional()
  @IsString()
  brokerAutoPhone?: string;

  // Per-policy broker fields - WC
  @IsOptional()
  @IsString()
  brokerWcName?: string;

  @IsOptional()
  @IsEmail()
  brokerWcEmail?: string;

  @IsOptional()
  @IsString()
  brokerWcPhone?: string;
}
