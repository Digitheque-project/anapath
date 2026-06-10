import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsObject, IsArray } from 'class-validator';

/** Format standard service-notification (POST /api/notifications) */
export class ServiceNotificationInboundDto {
  @ApiPropertyOptional({
    example: 'notif-uuid-123',
    description: 'Identifiant externe de la notification (optionnel)',
  })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({
    example: 'MEDICAL_ALERT',
    description: 'Type de notification (ex. MEDICAL_ALERT, DEMANDE_EXAMEN, RESULTAT_EXAMEN, AVIS_INTER_SERVICE)',
  })
  @IsString()
  type: string;

  @ApiProperty({
    example: 'Patient en détresse',
    description: 'Motif ou message principal de la notification',
  })
  @IsString()
  motif: string;

  @ApiProperty({
    example: 'service-anapath',
    description: 'Identifiant du service émetteur',
  })
  @IsString()
  sourceServiceId: string;

  @ApiPropertyOptional({
    example: 'Anapath',
    description: 'Nom lisible du service émetteur',
  })
  @IsOptional()
  @IsString()
  sourceServiceName?: string;

  @ApiProperty({
    example: 'service-urgence',
    description: 'Identifiant du service destinataire',
  })
  @IsString()
  targetServiceId: string;

  @ApiPropertyOptional({
    example: 'Urgence',
    description: 'Nom lisible du service destinataire',
  })
  @IsOptional()
  @IsString()
  targetServiceName?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Niveau d\'urgence (1 = faible, 5 = critique)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  urgence?: number;

  @ApiPropertyOptional({
    example: 'patient-123',
    description: 'Identifiant du patient concerné',
  })
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional({
    example: {
      dossier: 'ANP-456',
      observation: 'Résultat anatomopathologique disponible',
    },
    description: 'Données métier additionnelles',
  })
  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;

  @ApiPropertyOptional({
    example: ['SOUND', 'WEB'],
    description: 'Canaux de diffusion souhaités',
    isArray: true,
    type: String,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  channels?: string[];
}
