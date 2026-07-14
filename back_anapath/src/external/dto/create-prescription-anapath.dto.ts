import {
  IsString,
  IsOptional,
  IsEnum,
  IsObject,
  IsNotEmpty,
  IsArray,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({
    example: { organe: 'Foie', localisation: 'Lobe droit', nature: '3 fragments', fixateur: 'Formol 10%' },
    description: 'Données cliniques spécifiques au type d\'examen (conservées telles quelles)',
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}

/**
 * Corps reçu depuis le service Prescription (`CreateAnapathDto`).
 * Champs optionnels du swagger Prescription acceptés pour éviter un 400
 * avec `forbidNonWhitelisted` lorsque Prescription les forward tels quels.
 */
export class CreatePrescriptionAnapathDto {
  @ApiProperty({
    example: 'CHU-2026-00001',
    description: 'ID patient au format CHU-YYYY-NNNNN (service Accueil)',
  })
  @IsString()
  @IsNotEmpty()
  patientId: string;

  @ApiProperty({ example: 'prescripteur-uuid' })
  @IsString()
  @IsNotEmpty()
  prescripteurId: string;

  @ApiPropertyOptional({
    example: 'NORMALE',
    enum: ['NORMALE', 'URGENTE', 'STAT'],
    default: 'NORMALE',
    description: 'NORMALE (défaut) | URGENTE (< 2h) | STAT (< 30min, alerte sonore)',
  })
  @IsEnum(['NORMALE', 'URGENTE', 'STAT'])
  @IsOptional()
  urgence?: string;

  @ApiPropertyOptional({ example: 'Suspicion maligne' })
  @IsString()
  @IsOptional()
  alertes?: string;

  // --- Prescription MULTI-examens (format groupé du service Prescription) ---
  @ApiPropertyOptional({
    type: [DemandeExamenDto],
    description:
      'Liste des examens de la prescription (au moins un). Prioritaire sur typeExamen/data si présent.',
  })
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DemandeExamenDto)
  demandes?: DemandeExamenDto[];

  // --- Prescription MONO-examen (format legacy, rétrocompatible) ---
  @ApiPropertyOptional({
    example: 'BIOPSIE',
    enum: ['FCV_PAP', 'CYT0PONCTION', 'LIQUIDE', 'BIOPSIE', 'POS', 'POC', 'EXTEMPORANE_STAT'],
    description: 'Ignoré si `demandes` est fourni.',
  })
  @IsEnum(['FCV_PAP', 'CYT0PONCTION', 'LIQUIDE', 'BIOPSIE', 'POS', 'POC', 'EXTEMPORANE_STAT'])
  @IsOptional()
  typeExamen?: string;

  @ApiPropertyOptional({
    example: { organe: 'Foie', localisation: 'Lobe droit', nature: '3 fragments', fixateur: 'Formol 10%' },
    description: 'Ignoré si `demandes` est fourni.',
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @ApiPropertyOptional({
    example: 'chu-andrainjato-fianarantsoa',
    description: 'ID du CHU où le patient est pris en charge',
  })
  @IsString()
  @IsOptional()
  chuId?: string;

  @ApiPropertyOptional({
    example: 'service-neurologie-uuid',
    description: 'Service prescripteur (source). Alias legacy : serviceId.',
  })
  @IsString()
  @IsOptional()
  serviceIdSource?: string;

  @ApiPropertyOptional({
    example: 'service-anapath-uuid',
    description: 'Service destinataire (anapath) qui prend en charge la prescription.',
  })
  @IsString()
  @IsOptional()
  serviceIdDest?: string;

  @ApiPropertyOptional({
    example: 'lot-uuid',
    description: 'ID du lot/prescription groupée : lie entre eux les examens d\'une même prescription.',
  })
  @IsString()
  @IsOptional()
  lotId?: string;

  @ApiPropertyOptional({
    example: 'service-neurologie-uuid',
    description: 'Legacy : équivalent de serviceIdSource. Conservé pour rétrocompatibilité.',
  })
  @IsString()
  @IsOptional()
  serviceId?: string;

  // --- Champs optionnels du swagger Prescription (préservés en metadata) ---
  @ApiPropertyOptional({
    example: false,
    description: 'Indique si le prescripteur est un médecin externe (non présent dans user-services)',
  })
  @IsBoolean()
  @IsOptional()
  prescripteurExterne?: boolean;

  @ApiPropertyOptional({
    example: 'Dupont',
    description: 'Nom du prescripteur saisi manuellement (si prescripteur externe)',
  })
  @IsString()
  @IsOptional()
  prescripteurNomManuel?: string;

  @ApiPropertyOptional({
    example: 'Jean',
    description: 'Prénom du prescripteur saisi manuellement (si prescripteur externe)',
  })
  @IsString()
  @IsOptional()
  prescripteurPrenomManuel?: string;

  @ApiPropertyOptional({
    example: '12345',
    description: "Numéro à l'Ordre National des Médecins (si prescripteur externe)",
  })
  @IsString()
  @IsOptional()
  prescripteurOnm?: string;

  @ApiPropertyOptional({
    example: 'user-uuid',
    description: "ID de l'utilisateur CHU authentifié ayant soumis la prescription",
  })
  @IsString()
  @IsOptional()
  saisiParUserId?: string;

  @ApiPropertyOptional({
    example: 'Agent Accueil',
    description: "Nom de l'utilisateur CHU authentifié ayant soumis la prescription",
  })
  @IsString()
  @IsOptional()
  saisiParNom?: string;
}
