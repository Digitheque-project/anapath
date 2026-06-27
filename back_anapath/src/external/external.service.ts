import { Injectable } from '@nestjs/common';
import { AnapathService } from '../anapath/anapath.service';
import { CreatePrescriptionAnapathDto } from './dto/create-prescription-anapath.dto';
import { ChuClient } from '../common/clients/chu.client';
import { ExamenType } from '../anapath/entities/anapath-request.entity';

@Injectable()
export class ExternalService {
  constructor(
    private anapathService: AnapathService,
    private chuClient: ChuClient,
  ) {}

  async createFromPrescription(
    dto: CreatePrescriptionAnapathDto,
    serviceIdHeader?: string,
  ) {
    const data = dto.data || {};
    const requestingServiceId = serviceIdHeader || dto.serviceId;
    const isExtemporane =
      dto.urgence === 'STAT' ||
      dto.typeExamen === 'EXTEMPORANE_STAT';

    const prelevement = this.mapToPrelevement(dto.typeExamen, data, dto.alertes);

    const metadata: Record<string, unknown> = {};

    if (dto.serviceId || dto.chuId) {
      const [serviceInfo, chuInfo] = await Promise.allSettled([
        dto.serviceId ? this.chuClient.getService(dto.serviceId) : Promise.resolve(null),
        dto.chuId ? this.chuClient.getChu(dto.chuId) : Promise.resolve(null),
      ]);

      if (dto.serviceId) {
        metadata.serviceNom =
          serviceInfo.status === 'fulfilled' && serviceInfo.value?.name
            ? serviceInfo.value.name
            : 'Service inconnu';
        metadata.serviceId = dto.serviceId;
      }

      if (dto.chuId) {
        metadata.chuNom =
          chuInfo.status === 'fulfilled' && chuInfo.value?.name
            ? chuInfo.value.name
            : 'CHU inconnu';
        metadata.chuId = dto.chuId;
      }
    }

    const niveauUrgence = dto.urgence ?? 'NORMALE';
    metadata.urgence = niveauUrgence;
    metadata.prescripteurId = dto.prescripteurId;
    metadata.alertes = dto.alertes;
    metadata.sourceServiceId = requestingServiceId;

    const request = await this.anapathService.create({
      patientId: dto.patientId,
      episodeId: dto.serviceId,
      typeExamen: dto.typeExamen as unknown as ExamenType,
      isExtemporane,
      prelevement,
      metadata,
    });

    return request;
  }

  private mapToPrelevement(
    typeExamen: string,
    data: Record<string, any>,
    alertes?: string,
  ): { site: string; description: string } {
    let prelevement: { site: string; description: string };

    switch (typeExamen) {
      case 'BIOPSIE':
      case 'POS':
      case 'POC':
        prelevement = {
          site: data?.organe || 'Non spécifié',
          description: `Organe: ${data?.organe || '-'}, Localisation: ${data?.localisation || '-'}, Nature: ${data?.nature || '-'}, Fixateur: ${data?.fixateur || '-'}`,
        };
        break;
      case 'FCV_PAP':
        prelevement = {
          site: 'Col utérin',
          description: `État du col: ${data?.etat_col || 'Non spécifié'}`,
        };
        break;
      case 'LIQUIDE':
        prelevement = {
          site: data?.type_liquide || 'Liquide biologique',
          description: `Volume: ${data?.volume || '-'}`,
        };
        break;
      case 'CYT0PONCTION':
        prelevement = {
          site: data?.organe || 'Non spécifié',
          description: `Cytoponction - Site: ${data?.organe || '-'}, Nature: ${data?.nature || '-'}`,
        };
        break;
      case 'EXTEMPORANE_STAT':
        prelevement = {
          site: data?.organe || 'Non spécifié',
          description: `Urgence chirurgicale: ${data?.urgence_chirurgicale || 'Oui'}`,
        };
        break;
      default:
        prelevement = {
          site: data?.organe || 'Non spécifié',
          description: JSON.stringify(data),
        };
    }

    if (alertes) {
      prelevement.description = `Alertes: ${alertes}. ${prelevement.description}`;
    }

    return prelevement;
  }
}
