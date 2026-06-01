import { IsString, IsOptional, IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum NotificationType {
  STAT_ALERT = 'STAT_ALERT',
  RESULTAT_DISPONIBLE = 'RESULTAT_DISPONIBLE',
  VALIDATION = 'VALIDATION',
  URGENT = 'URGENT',
  INFO = 'INFO'
}

export class ReceiveNotificationDto {
  @ApiProperty({ enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  priority?: 'high' | 'medium' | 'low';

  @ApiProperty()
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  @IsString()
  @IsOptional()
  source?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  timestamp?: string;
}
