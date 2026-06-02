import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class NotificationClient {
  private readonly baseUrl: string;
  private readonly serviceId: string;

  constructor(private configService: ConfigService) {
    const raw = this.configService.get<string>('NOTIFICATION_API_URL') || '';
    // service-notification expose /notifications (pas /api/notifications)
    this.baseUrl = raw.replace(/\/api\/?$/, '').replace(/\/$/, '');
    this.serviceId = this.configService.get<string>('ANAPATH_ID') || 'anapath-service';
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Service-ID': this.serviceId,
    };
  }

  async sendNotification(notification: {
    type: string;
    motif: string;
    urgence?: number;
    sourceServiceId?: string;
    sourceServiceName?: string;
    targetServiceId?: string;
    targetServiceName?: string;
    patientId?: string;
    payload?: Record<string, any>;
  }) {
    if (!this.baseUrl) {
      console.warn('⚠️ NOTIFICATION_API_URL non définie, notification non envoyée');
      return null;
    }

    try {
      const payload = {
        type: notification.type,
        motif: notification.motif,
        urgence: notification.urgence ?? 3,
        sourceServiceId: notification.sourceServiceId ?? this.serviceId,
        sourceServiceName: notification.sourceServiceName ?? 'Anapath',
        targetServiceId: notification.targetServiceId,
        targetServiceName: notification.targetServiceName,
        patientId: notification.patientId,
        payload: notification.payload,
      };

      const response = await axios.post(`${this.baseUrl}/notifications`, payload, {
        headers: this.getHeaders(),
      });
      console.log(`✅ Notification envoyée: ${notification.motif}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur envoi notification:`, error.message);
      return null;
    }
  }

  async sendStatAlert(
    anapathId: string,
    patientId: string,
    message: string,
    targetServiceId: string,
  ) {
    return this.sendNotification({
      type: 'DEMANDE_EXAMEN',
      motif: `🚨 ALERTE STAT - ${message} - ID: ${anapathId} - Patient: ${patientId}`,
      urgence: 5,
      targetServiceId,
      targetServiceName: 'Destinataire',
      patientId,
      payload: { anapathId, patientId, type: 'extemporane' },
    });
  }

  async sendResultatDisponible(
    anapathId: string,
    patientId: string,
    targetServiceId: string,
  ) {
    return this.sendNotification({
      type: 'RESULTAT_EXAMEN',
      motif: `Résultat disponible pour l'examen ${anapathId} (patient ${patientId})`,
      urgence: 4,
      targetServiceId,
      patientId,
      payload: { anapathId, patientId },
    });
  }

  async sendValidationNotification(
    anapathId: string,
    patientId: string,
    validateur: string,
    targetServiceId: string,
  ) {
    return this.sendNotification({
      type: 'AVIS_INTER_SERVICE',
      motif: `Examen ${anapathId} validé par ${validateur}`,
      urgence: 2,
      targetServiceId,
      patientId,
      payload: { anapathId, patientId, validateur },
    });
  }
}