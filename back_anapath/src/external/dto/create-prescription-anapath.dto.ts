import { IsString, IsOptional, IsEnum, IsObject, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UrgenceLevel {
  NORMALE = 'NORMALE',
  URGENTE = 'URGENTE',
  STAT = 'STAT',
}

export enum ExamenTypeExterne {
  FCV_PAP = 'FCV_PAP',
  CYT0PONCTION = 'CYT0PONCTION',
  LIQUIDE = 'LIQUIDE',
  BIOPSIE = 'BIOPSIE',
  POS = 'POS',
  POC = 'POC',
  EXTEMPORANE_STAT = 'EXTEMPORANE_STAT',
}

export class CreatePrescriptionAnapathDto {
  @ApiProperty({ example: 'CHU-2026-00001', description: 'ID patient au format CHU-YYYY-NNNNN' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: 'prescripteur-uuid' })
  @IsString()
  prescripteurId: string;

  @ApiProperty({ example: 'NORMALE', enum: ['NORMALE', 'URGENTE', 'STAT'] })
  @IsEnum(['NORMALE', 'URGENTE', 'STAT'])
  @IsOptional()
  urgence?: string;

  @ApiProperty({ example: 'Suspicion maligne', required: false })
  @IsString()
  @IsOptional()
  alertes?: string;

  @ApiProperty({ example: 'BIOPSIE', enum: ['FCV_PAP', 'CYT0PONCTION', 'LIQUIDE', 'BIOPSIE', 'POS', 'POC', 'EXTEMPORANE_STAT'] })
  @IsEnum(['FCV_PAP', 'CYT0PONCTION', 'LIQUIDE', 'BIOPSIE', 'POS', 'POC', 'EXTEMPORANE_STAT'])
  typeExamen: string;

  @ApiProperty({
    example: { organe: 'Foie', localisation: 'Lobe droit', nature: '3 fragments', fixateur: 'Formol 10%' },
    required: false,
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @ApiProperty({ example: 'chu-andrainjato-fianarantsoa', required: false })
  @IsString()
  @IsOptional()
  chuId?: string;

  @ApiProperty({ example: 'service-neurologie-uuid', required: false })
  @IsString()
  @IsOptional()
  serviceId?: string;
}