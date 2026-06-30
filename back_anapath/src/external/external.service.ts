import { Injectable } from '@nestjs/common';
import { AnapathService } from '../anapath/anapath.service';
import { CreatePrescriptionAnapathDto } from './dto/create-prescription-anapath.dto';
import { ChuClient } from '../common/clients/chu.client';
import { AccueilClient } from '../common/clients/accueil.client';
import { ExamenType } from '../anapath/entities/anapath-request.entity';

@Injectable()
export class ExternalService {
  constructor(
    private anapathService: AnapathService,
    private chuClient: ChuClient,
    private accueilClient: AccueilClient,
  ) {}

  async createFromPrescription(
    dto: CreatePrescriptionAnapathDto,
    serviceIdHeader?: string,
  ) {
    const {
      patientId,
      prescripteurId,
      urgence,
      alertes,
      typeExamen,
      data,
      chuId,
      serviceId,
    } = dto;

    const [patientResult, serviceResult, chuResult] = await Promise.allSettled([
      chuId
        ? this.accueilClient.getPatient(patientId, chuId)
        : Promise.resolve(null),
      serviceId
        ? this.chuClient.getService(serviceId)
        : Promise.resolve(null),
      chuId
        ? this.chuClient.getChu(chuId)
        : Promise.resolve(null),
    ]);

    const patient = patientResult.status === 'fulfilled'
      ? patientResult.value
      : null;
    const service = serviceResult.status === 'fulfilled'
      ? serviceResult.value
      : null;
    const chu = chuResult.status === 'fulfilled'
      ? chuResult.value
      : null;

    const patientInfo = patient ? {
      nom: patient.nom ?? '',
      prenom: patient.prenom ?? '',
      sexe: patient.sexe ?? null,
      dateNaissance: patient.dateNaissance ?? null,
      cin: patient.cin ?? null,
      profession: patient.profession ?? null,
      adresse: patient.adresse ?? null,
      telephone: patient.telephone ?? null,
      contactUrgence: patient.contactUrgence ?? null,
      priseEnChargeId: patient.priseEnChargeId ?? null,
    } : null;

    const prelevement = this.mapPrelevement(typeExamen, data);

    const metadata: Record<string, unknown> = {
      prescripteurId,
      serviceId,
      serviceNom: service?.name ?? 'Service inconnu',
      chuId,
      chuNom: chu?.name ?? 'CHU inconnu',
      alertes: alertes ?? null,
      urgence: urgence ?? 'NORMALE',
      sourceService: 'prescription',
      sourceServiceId: serviceIdHeader || serviceId,
      receivedAt: new Date().toISOString(),
    };

    const request = await this.anapathService.create({
      patientId,
      episodeId: serviceId,
      typeExamen: typeExamen as unknown as ExamenType,
      isExtemporane: typeExamen === 'EXTEMPORANE_STAT',
      patientInfo: patientInfo ?? undefined,
      prelevement,
      metadata,
    });

    console.log(
      `✅ Examen créé : ${request.anapathId}`,
      `| Patient: ${patientInfo?.nom ?? patientId}`,
      `| Type: ${typeExamen}`,
      `| Urgence: ${urgence ?? 'NORMALE'}`,
      `| Patient trouvé via Accueil: ${!!patient}`,
    );

    return request;
  }

  private mapPrelevement(typeExamen: string, data: any = {}) {
    switch (typeExamen) {
      case 'BIOPSIE':
      case 'POS':
      case 'POC':
        return {
          site: data.organe ?? '',
          description: data.nature ?? data.localisation ?? '',
          clinicalData: data,
        };
      case 'FCV_PAP':
        return {
          site: 'Col utérin',
          description: data.etat_col ?? '',
          clinicalData: data,
        };
      case 'LIQUIDE':
        return {
          site: data.type_liquide ?? '',
          description: data.volume ?? '',
          clinicalData: data,
        };
      case 'CYT0PONCTION':
        return {
          site: data.organe ?? '',
          description: data.localisation ?? '',
          clinicalData: data,
        };
      case 'EXTEMPORANE_STAT':
        return {
          site: data.organe ?? '',
          description: data.urgence_chirurgicale ?? '',
          clinicalData: data,
        };
      default:
        return {
          site: '',
          description: '',
          clinicalData: data,
        };
    }
  }
}
