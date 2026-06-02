import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class NotificationClient {
  private readonly baseUrl: string;
  private readonly serviceId: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get('NOTIFICATION_API_URL');
    this.serviceId = this.configService.get('ANAPATH_ID');
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Service-ID': this.serviceId || 'anapath-service',
    };
  }

  async sendNotification(notification: {
    type: 'STAT_ALERT' | 'RESULTAT_DISPONIBLE' | 'VALIDATION' | 'URGENT';
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
    recipientIds?: string[];
    metadata?: Record<string, any>;
  }) {
    if (!this.baseUrl) {
      console.warn('⚠️ NOTIFICATION_API_URL non définie, notification non envoyée');
      return null;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/notifications`, notification, {
        headers: this.getHeaders(),
      });
      console.log(`✅ Notification envoyée: ${notification.title}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur envoi notification:`, error.message);
      return null;
    }
  }

  async sendStatAlert(anapathId: string, patientId: string, message: string) {
    return this.sendNotification({
      type: 'STAT_ALERT',
      title: '🚨 ALERTE STAT - Examen extemporané',
      message: `${message} - ID: ${anapathId} - Patient: ${patientId}`,
      priority: 'high',
      metadata: { anapathId, patientId, type: 'extemporane' },
    });
  }

  async sendResultatDisponible(anapathId: string, patientId: string) {
    return this.sendNotification({
      type: 'RESULTAT_DISPONIBLE',
      title: '📋 Résultat disponible',
      message: `Le résultat pour l'examen ${anapathId} (patient ${patientId}) est disponible.`,
      priority: 'medium',
      metadata: { anapathId, patientId },
    });
  }

  async sendValidationNotification(anapathId: string, patientId: string, validateur: string) {
    return this.sendNotification({
      type: 'VALIDATION',
      title: '✅ Demande validée',
      message: `L'examen ${anapathId} a été validé par ${validateur}.`,
      priority: 'low',
      metadata: { anapathId, patientId, validateur },
    });
  }
}
