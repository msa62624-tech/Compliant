import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContractorStatus } from '@prisma/client';

export class UpdateContractorDto {
  @ApiProperty({ example: 'John Doe Construction', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'contractor@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '+1-555-0123', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'ABC Construction LLC', required: false })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiProperty({ enum: ContractorStatus, example: ContractorStatus.ACTIVE, required: false })
  @IsEnum(ContractorStatus)
  @IsOptional()
  status?: ContractorStatus;
}
