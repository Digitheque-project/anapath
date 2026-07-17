import { IsEnum, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { EtapeCode } from '../entities/anapath-request.entity';

export class UpdateEtapeObservationDto {
  @ApiProperty({ enum: EtapeCode, example: EtapeCode.LECTURE })
  @IsEnum(EtapeCode)
  code: EtapeCode;

  @ApiProperty({ example: 'Foyer suspect en périphérie, à corréler avec la clinique.' })
  @IsString()
  observations: string;
}

export class UpdateEtapesObservationsBulkDto {
  @ApiProperty({ type: [UpdateEtapeObservationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateEtapeObservationDto)
  etapes: UpdateEtapeObservationDto[];
}
