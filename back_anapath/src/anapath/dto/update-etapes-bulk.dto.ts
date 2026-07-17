import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateEtapeDto } from './update-etape.dto';

export class UpdateEtapesBulkDto {
  @ApiProperty({ type: [UpdateEtapeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateEtapeDto)
  etapes: UpdateEtapeDto[];
}
