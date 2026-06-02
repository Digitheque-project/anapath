import { IsString, IsOptional, IsNumber, IsObject } from 'class-validator';

/** Payload envoyé par https://service-notification.onrender.com */
export class ServiceNotificationInboundDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  type: string;

  @IsString()
  motif: string;

  @IsOptional()
  @IsNumber()
  urgence?: number;

  @IsString()
  sourceServiceId: string;

  @IsOptional()
  @IsString()
  sourceServiceName?: string;

  @IsString()
  targetServiceId: string;

  @IsOptional()
  @IsString()
  targetServiceName?: string;

  @IsOptional()
  @IsString()
  patientId?: string;

  @IsOptional()
  @IsObject()
  payload?: Record<string, any>;
}
