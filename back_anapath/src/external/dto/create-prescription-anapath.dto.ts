import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsNotEmpty,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
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

/**
 * Un examen unitaire au sein d'une prescription. Le service Prescription peut
 * en envoyer un seul (via `typeExamen`/`data` au niveau racine, format legacy)
 * ou plusieurs (via le tableau `demandes`).
 */
export class DemandeExamenDto {
  @ApiProperty({
    example: 'BIOPSIE',
    enum: ['FCV_PAP', 'CYT0PONCTION', 'LIQUIDE', 'BIOPSIE', 'POS', 'POC', 'EXTEMPORANE_STAT'],
  })
  @IsEnum(['FCV_PAP', 'CYT0PONCTION', 'LIQUIDE', 'BIOPSIE', 'POS', 'POC', 'EXTEMPORANE_STAT'])
  typeExamen: string;

  @ApiProperty({
    example: { organe: 'Foie', localisation: 'Lobe droit', nature: '3 fragments', fixateur: 'Formol 10%' },
    required: false,
    description: 'Données cliniques spécifiques au type d\'examen (conservées telles quelles)',
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
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

  // --- Prescription MULTI-examens (format groupé du service Prescription) ---
  @ApiProperty({
    type: [DemandeExamenDto],
    required: false,
    description:
      'Liste des examens de la prescription (au moins un). Prioritaire sur typeExamen/data si présent.',
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DemandeExamenDto)
  demandes?: DemandeExamenDto[];

  // --- Prescription MONO-examen (format legacy, rétrocompatible) ---
  @ApiProperty({
    example: 'BIOPSIE',
    enum: ['FCV_PAP', 'CYT0PONCTION', 'LIQUIDE', 'BIOPSIE', 'POS', 'POC', 'EXTEMPORANE_STAT'],
    required: false,
    description: 'Ignoré si `demandes` est fourni.',
  })
  @IsEnum(['FCV_PAP', 'CYT0PONCTION', 'LIQUIDE', 'BIOPSIE', 'POS', 'POC', 'EXTEMPORANE_STAT'])
  @IsOptional()
  typeExamen?: string;

  @ApiProperty({
    example: { organe: 'Foie', localisation: 'Lobe droit', nature: '3 fragments', fixateur: 'Formol 10%' },
    required: false,
    description: 'Ignoré si `demandes` est fourni.',
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @ApiProperty({ example: 'chu-andrainjato-fianarantsoa', required: false })
  @IsString()
  @IsOptional()
  chuId?: string;

  @ApiProperty({
    example: 'service-neurologie-uuid',
    required: false,
    description: 'Service prescripteur (source). Alias legacy : serviceId.',
  })
  @IsString()
  @IsOptional()
  serviceIdSource?: string;

  @ApiProperty({
    example: 'service-anapath-uuid',
    required: false,
    description: 'Service destinataire (anapath) qui prend en charge la prescription.',
  })
  @IsString()
  @IsOptional()
  serviceIdDest?: string;

  @ApiProperty({
    example: 'lot-uuid',
    required: false,
    description: 'ID du lot/prescription groupée : lie entre eux les examens d\'une même prescription.',
  })
  @IsString()
  @IsOptional()
  lotId?: string;

  @ApiProperty({
    example: 'service-neurologie-uuid',
    required: false,
    description: 'Legacy : équivalent de serviceIdSource. Conservé pour rétrocompatibilité.',
  })
  @IsString()
  @IsOptional()
  serviceId?: string;
}
