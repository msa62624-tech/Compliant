import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignContractorDto {
  @ApiProperty({ example: 'uuid-here' })
  @IsUUID()
  @IsNotEmpty()
  contractorId: string;

  @ApiProperty({ example: 'General Contractor', required: false })
  @IsString()
  @IsOptional()
  role?: string;
}
