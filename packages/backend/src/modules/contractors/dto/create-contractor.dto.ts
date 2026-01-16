import { IsEmail, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContractorDto {
  @ApiProperty({ example: 'John Doe Construction' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'contractor@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+1-555-0123', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'ABC Construction LLC', required: false })
  @IsString()
  @IsOptional()
  company?: string;
}
