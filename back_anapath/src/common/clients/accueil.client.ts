import { Injectable } from '@nestjs/common';

const ACCUEIL_BASE_URL =
  process.env.ACCUEIL_BASE_URL ??
  'https://acceuil-back-production.up.railway.app';

@Injectable()
export class AccueilClient {
  async getPatient(patientId: string, chuId: string): Promise<any | null> {
    if (!patientId || !chuId) {
      console.warn('getPatient: patientId et chuId requis', { patientId, chuId });
      return null;
    }
    try {
      const url = `${ACCUEIL_BASE_URL}/accueil/patients/`
        + `${encodeURIComponent(patientId)}`
        + `?chuId=${encodeURIComponent(chuId)}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        console.warn(`Accueil getPatient ${res.status}:`, url);
        return null;
      }
      const data = await res.json();
      return data;
    } catch (e) {
      console.warn('Accueil getPatient erreur:', e);
      return null;
    }
  }

  async getPatientsByChu(chuId: string): Promise<any[]> {
    if (!chuId) return [];
    try {
      const url = `${ACCUEIL_BASE_URL}/accueil/patients`
        + `?chuId=${encodeURIComponent(chuId)}`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.warn('Accueil getPatientsByChu erreur:', e);
      return [];
    }
  }

  calculateAge(dateNaissance: string): number | null {
    if (!dateNaissance) return null;
    try {
      const birth = new Date(dateNaissance);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    } catch {
      return null;
    }
  }

  buildNomComplet(patient: any): string {
    if (!patient) return '';
    const nom = patient.nom ?? '';
    const prenom = patient.prenom ?? '';
    return [nom, prenom].filter(Boolean).join(' ').trim();
  }
}
