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
  EXTEMPORANE_STAT = 'EXTEMPORANE_STAT',
}

export class CreatePrescriptionAnapathDto {
  @ApiProperty({ example: 'CHU-2026-00001', description: 'ID patient au format CHU-YYYY-NNNNN' })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: 'prescripteur-uuid' })
  @IsString()
  @IsNotEmpty()
  prescripteurId: string;

  @ApiProperty({
    example: 'prescription-uuid',
    required: false,
    description: 'ID de la prescription créée côté service prescription (si transmis)',
  })
  @IsString()
  @IsOptional()
  prescriptionId?: string;

  @ApiProperty({ enum: UrgenceLevel, default: UrgenceLevel.NORMALE })
  @IsEnum(UrgenceLevel)
  @IsOptional()
  urgence?: UrgenceLevel;

  @ApiProperty({ example: 'Suspicion maligne', required: false })
  @IsString()
  @IsOptional()
  alertes?: string;

  @ApiProperty({ enum: ExamenTypeExterne, example: 'BIOPSIE' })
  @IsEnum(ExamenTypeExterne)
  @IsNotEmpty()
  typeExamen: ExamenTypeExterne;

  @ApiProperty({
    example: { organe: 'Foie', localisation: 'Lobe droit', nature: '3 fragments', fixateur: 'Formol 10%' },
    description: 'Données spécifiques selon typeExamen',
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