import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UploadFileDto {
  @ApiProperty({ description: 'Original filename', required: false })
  @IsOptional()
  @IsString()
  originalName?: string;

  @ApiProperty({ description: 'File metadata', required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}
