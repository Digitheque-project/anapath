import {
  IsEnum,
  IsBoolean,
  IsOptional,
  IsArray,
  IsString,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EtapeCode } from '../entities/anapath-request.entity';

class MaterielDto {
  @ApiProperty({ example: 'Cassette' })
  @IsString()
  nom: string;

  @ApiProperty({ example: 3 })
  @IsNumber()
  quantite: number;

  @ApiProperty({ example: 'unité', required: false })
  @IsOptional()
  @IsString()
  unite?: string;
}

export class UpdateEtapeDto {
  @ApiProperty({ enum: EtapeCode, example: EtapeCode.MACROSCOPIE })
  @IsEnum(EtapeCode)
  code: EtapeCode;

  @ApiProperty({ example: true })
  @IsBoolean()
  complete: boolean;

  @ApiProperty({ type: [MaterielDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterielDto)
  materiels?: MaterielDto[];
}
