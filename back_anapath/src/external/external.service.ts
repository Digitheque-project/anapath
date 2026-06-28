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
    const data = dto.data || {};
    const { patientId, prescripteurId, urgence, alertes, typeExamen, chuId, serviceId } = dto;
    const niveauUrgence = urgence ?? 'NORMALE';

    const [patientResult, serviceResult, chuResult] = await Promise.allSettled([
      chuId ? this.accueilClient.getPatient(patientId, chuId) : Promise.resolve(null),
      serviceId ? this.chuClient.getService(serviceId) : Promise.resolve(null),
      chuId ? this.chuClient.getChu(chuId) : Promise.resolve(null),
    ]);

    const patient = patientResult.status === 'fulfilled' ? patientResult.value : null;
    const service = serviceResult.status === 'fulfilled' ? serviceResult.value : null;
    const chu = chuResult.status === 'fulfilled' ? chuResult.value : null;

    const patientInfo = patient
      ? {
          nom: patient.nom,
          prenom: patient.prenom,
          nomComplet: `${patient.nom} ${patient.prenom}`,
          sexe: patient.sexe,
          dateNaissance: patient.dateNaissance,
          age: this.accueilClient.calculateAge(patient.dateNaissance),
          cin: patient.cin ?? null,
          profession: patient.profession ?? null,
          adresse: patient.adresse ?? null,
          telephone: patient.telephone ?? null,
          contactUrgence: patient.contactUrgence ?? null,
          priseEnChargeId: patient.priseEnChargeId ?? null,
        }
      : null;

    const prelevement = {
      site: data?.organe ?? data?.type_liquide ?? data?.etat_col ?? '',
      description: data?.nature ?? data?.volume ?? data?.localisation ?? '',
      clinicalData: {
        alertes: alertes ?? null,
        ...data,
      },
    };

    const metadata: Record<string, unknown> = {
      prescripteurId,
      serviceId,
      serviceNom: service?.name ?? 'Service inconnu',
      chuId,
      chuNom: chu?.name ?? 'CHU inconnu',
      urgence: niveauUrgence,
      sourceService: 'prescription',
      sourceServiceId: serviceIdHeader || serviceId,
      receivedAt: new Date().toISOString(),
      alertes,
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
      `✅ Examen créé : ${request.anapathId} | Patient: ${patient?.nom ?? patientId} | Type: ${typeExamen} | Urgence: ${niveauUrgence}`,
    );

    return request;
  }
}
