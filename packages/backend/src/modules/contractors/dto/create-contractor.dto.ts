import { IsEmail, IsNotEmpty, IsString, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { SanitizeHtml } from "../../../common/sanitizers/string-sanitizer";

export class CreateContractorDto {
  @ApiProperty({ example: "John Doe Construction" })
  @SanitizeHtml()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "contractor@example.com" })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: "+1-555-0123", required: false })
  @SanitizeHtml()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: "ABC Construction LLC", required: false })
  @SanitizeHtml()
  @IsString()
  @IsOptional()
  company?: string;
}
