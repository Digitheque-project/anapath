import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateAnapathDto {
  @ApiProperty({ example: 'Dr. Aris Thorne', description: 'Signature électronique' })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({ example: 'ONM-12345', description: 'Numéro d\'inscription à l\'Ordre professionnel' })
  @IsString()
  @IsNotEmpty()
  ordreProfessionnelNumber: string;
}