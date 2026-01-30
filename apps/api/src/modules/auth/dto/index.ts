import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securepassword123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiPropertyOptional({ example: '0241234567' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'GHA-123456789-0', description: 'Ghana Card Number (format: GHA-XXXXXXXXX-X)' })
  @IsString()
  @Matches(/^GHA-\d{9}-\d$/, { message: 'Ghana Card number must be in format GHA-XXXXXXXXX-X' })
  ghanaCardNumber: string;
}

export class LoginDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'securepassword123' })
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}
