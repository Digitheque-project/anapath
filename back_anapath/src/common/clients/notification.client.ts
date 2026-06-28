import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class NotificationClient {
  private readonly baseUrl: string;
  private readonly serviceId: string;
  private readonly timeout = 5000;

  constructor(private configService: ConfigService) {
    this.baseUrl = (
      this.configService.get<string>('NOTIF_SERVICE_URL') ??
      process.env.NOTIF_SERVICE_URL ??
      'https://prescription-back-7m7a.onrender.com'
    ).replace(/\/$/, '');
    this.serviceId =
      this.configService.get<string>('ANAPATH_SERVICE_ID') ??
      process.env.ANAPATH_SERVICE_ID ??
      '14a94274-db57-49e3-9375-1e642729b92b';
  }

  async getNotificationsService(): Promise<any[]> {
    try {
      const { data } = await axios.get(
        `${this.baseUrl}/notifications/service/${this.serviceId}`,
        { timeout: this.timeout },
      );
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  async getUnreadNotifications(): Promise<any[]> {
    try {
      const { data } = await axios.get(
        `${this.baseUrl}/notifications/non-lues/${this.serviceId}`,
        { timeout: this.timeout },
      );
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await axios.put(`${this.baseUrl}/notifications/${notificationId}/lire`, null, {
        timeout: this.timeout,
      });
    } catch {
      // mode dégradé — ne pas bloquer
    }
  }

  getAnapathServiceId(): string {
    return this.serviceId;
  }
}
