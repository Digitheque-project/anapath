import { Injectable, BadRequestException } from '@nestjs/common';
import { AnapathService } from '../anapath/anapath.service';
import {
  CreatePrescriptionAnapathDto,
  DemandeExamenDto,
} from './dto/create-prescription-anapath.dto';
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
    const { patientId, prescripteurId, urgence, alertes, chuId, lotId } = dto;

    // Le service Prescription peut envoyer un examen (legacy: typeExamen/data)
    // ou plusieurs (demandes[]). On normalise vers une liste, sans rien perdre.
    const demandes = this.normalizeDemandes(dto);

    // Source = service prescripteur ; Dest = service anapath. On accepte les
    // deux noms + l'alias legacy `serviceId` pour ne perdre aucune référence.
    const sourceServiceId = dto.serviceIdSource ?? dto.serviceId ?? null;
    const destServiceId = dto.serviceIdDest ?? null;

    // Enrichissements (patient / service / chu) : une seule fois pour toute la
    // prescription, partagés par tous les examens du lot.
    const [patientResult, serviceResult, chuResult] = await Promise.allSettled([
      chuId
        ? this.accueilClient.getPatient(patientId, chuId)
        : Promise.resolve(null),
      sourceServiceId
        ? this.chuClient.getService(sourceServiceId)
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
      // On conserve l'INTÉGRALITÉ de la fiche renvoyée par Accueil (aucun champ
      // perdu, y compris les ajouts futurs), puis on garantit la présence des
      // champs clés + quelques valeurs calculées pratiques pour l'UI.
      ...patient,
      nom: patient.nom ?? '',
      prenom: patient.prenom ?? '',
      sexe: patient.sexe ?? null,
      dateNaissance: patient.dateNaissance ?? null,
      cin: patient.cin ?? null,
      profession: patient.profession ?? null,
      adresse: patient.adresse ?? null,
      telephone: patient.telephone ?? null,
      contactUrgence: patient.contactUrgence ?? null,
      chuId: patient.chuId ?? chuId ?? null,
      priseEnChargeId: patient.priseEnChargeId ?? null,
      nomComplet: this.accueilClient.buildNomComplet(patient),
      age: this.accueilClient.calculateAge(patient.dateNaissance),
    } : null;

    const receivedAt = new Date().toISOString();
    const createdRequests: Awaited<
      ReturnType<AnapathService['create']>
    >[] = [];

    // Un AnapathRequest par examen ; le lotId les relie via prescriptionId.
    for (const demande of demandes) {
      const typeExamen = demande.typeExamen;
      const data = demande.data ?? {};
      const prelevement = this.mapPrelevement(typeExamen, data);

      const metadata: Record<string, unknown> = {
        prescripteurId,
        serviceId: sourceServiceId,
        serviceIdSource: sourceServiceId,
        serviceIdDest: destServiceId,
        serviceNom: service?.name ?? 'Service inconnu',
        chuId,
        chuNom: chu?.name ?? 'CHU inconnu',
        alertes: alertes ?? null,
        urgence: urgence ?? 'NORMALE',
        lotId: lotId ?? null,
        sourceService: 'prescription',
        sourceServiceId: serviceIdHeader || destServiceId || sourceServiceId,
        receivedAt,
        // Champs optionnels Prescription (audit / traçabilité)
        prescripteurExterne: dto.prescripteurExterne ?? null,
        prescripteurNomManuel: dto.prescripteurNomManuel ?? null,
        prescripteurPrenomManuel: dto.prescripteurPrenomManuel ?? null,
        prescripteurOnm: dto.prescripteurOnm ?? null,
        saisiParUserId: dto.saisiParUserId ?? null,
        saisiParNom: dto.saisiParNom ?? null,
      };

      const request = await this.anapathService.create({
        patientId,
        episodeId: sourceServiceId ?? undefined,
        prescriptionId: lotId ?? undefined,
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
        lotId ? `| Lot: ${lotId}` : '',
        `| Patient trouvé via Accueil: ${!!patient}`,
      );

      createdRequests.push(request);
    }

    // Rétrocompat : format legacy mono-examen -> on renvoie l'objet unique.
    // Format groupé -> on renvoie le lot complet (aucun examen masqué).
    const isGrouped = Array.isArray(dto.demandes) && dto.demandes.length > 0;
    if (isGrouped) {
      return {
        lotId: lotId ?? null,
        count: createdRequests.length,
        requests: createdRequests,
      };
    }
    return createdRequests[0];
  }

  /**
   * Ramène l'entrée (mono ou multi-examens) à une liste non vide de demandes.
   * `demandes[]` prime sur le couple racine `typeExamen`/`data`.
   */
  private normalizeDemandes(
    dto: CreatePrescriptionAnapathDto,
  ): DemandeExamenDto[] {
    if (Array.isArray(dto.demandes) && dto.demandes.length > 0) {
      return dto.demandes.map((d) => ({
        typeExamen: d.typeExamen,
        data: d.data ?? {},
      }));
    }
    if (dto.typeExamen) {
      return [{ typeExamen: dto.typeExamen, data: dto.data ?? {} }];
    }
    throw new BadRequestException(
      'Au moins un examen est requis : fournissez `demandes[]` ou `typeExamen`.',
    );
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
