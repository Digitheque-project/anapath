import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AccueilClient {
  private readonly baseUrl: string;
  private readonly timeout = 5000;

  constructor(configService?: ConfigService) {
    this.baseUrl = (
      configService?.get<string>('ACCUEIL_BASE_URL') ??
      process.env.ACCUEIL_BASE_URL ??
      'https://acceuil-back-production.up.railway.app'
    ).replace(/\/$/, '');
  }

  calculateAge(dateNaissance: string): number {
    const birth = new Date(dateNaissance);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
  }

  async getPatient(patientId: string, chuId: string): Promise<any> {
    try {
      const { data } = await axios.get(
        `${this.baseUrl}/accueil/patients/${patientId}`,
        { params: { chuId }, timeout: this.timeout },
      );
      return data;
    } catch {
      return null;
    }
  }

  async getPatientsByChu(chuId: string): Promise<any[]> {
    try {
      const { data } = await axios.get(`${this.baseUrl}/accueil/patients`, {
        params: { chuId },
        timeout: this.timeout,
      });
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }
}
