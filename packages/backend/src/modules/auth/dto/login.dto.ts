import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto {
  @ApiProperty({ example: "admin@compliant.com", required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: "admin", required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ example: "Admin123!@#" })
  @IsString()
  @IsNotEmpty()
  password: string;
}
