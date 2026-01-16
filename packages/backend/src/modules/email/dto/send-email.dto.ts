import { IsEmail, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendEmailDto {
  @ApiProperty({ description: 'Recipient email address' })
  @IsEmail()
  to: string;

  @ApiProperty({ description: 'Email subject' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Email template name' })
  @IsString()
  template: string;

  @ApiProperty({ description: 'Template variables', required: false })
  @IsOptional()
  @IsObject()
  variables?: Record<string, any>;

  @ApiProperty({ description: 'Sender email address', required: false })
  @IsOptional()
  @IsEmail()
  from?: string;
}
