import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class ReplyToNotificationDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsOptional()
  @IsUUID()
  projectId?: string;

  @IsOptional()
  @IsUUID()
  subcontractorId?: string;

  @IsOptional()
  @IsUUID()
  coiId?: string;
}
