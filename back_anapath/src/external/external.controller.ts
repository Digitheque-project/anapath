import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnapathService } from '../anapath/anapath.service';
import { CreatePrescriptionAnapathDto } from './dto/create-prescription-anapath.dto';
import { NotificationService } from '../notification/notification.service';
import { ExamenType } from '../anapath/entities/anapath-request.entity';

@ApiTags('external')
@Controller('external')
export class ExternalController {
  constructor(
    private anapathService: AnapathService,
    private notificationService: NotificationService,
  ) {}

  @Post('anapath')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Recevoir une prescription Anapath depuis le service de prescription' })
  @ApiResponse({ status: 201, description: 'Prescription créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
  async createFromPrescription(
    @Body() dto: CreatePrescriptionAnapathDto,
    @Headers('x-service-id') serviceIdHeader?: string,
  ) {
    const data = dto.data || {};
    const requestingServiceId = serviceIdHeader || dto.serviceId;
    const isExtemporane =
      dto.urgence === 'STAT' ||
      dto.typeExamen === 'EXTEMPORANE_STAT';

    const prelevement = this.mapToPrelevement(dto.typeExamen, data, dto.alertes);

    const request = await this.anapathService.create({
      patientId: dto.patientId,
      episodeId: dto.serviceId,
      typeExamen: dto.typeExamen as unknown as ExamenType,
      isExtemporane,
      prelevement,
    });

    const isUrgent = dto.urgence === 'STAT' || dto.urgence === 'URGENTE';

    await this.notificationService.createNotification({
      type: isUrgent ? 'STAT_ALERT' : 'NEW_EXAM',
      title: isUrgent ? '🚨 Nouvelle prescription Anapath STAT' : '📋 Nouvelle prescription Anapath',
      message: `Prescription ${request.anapathId} reçue pour le patient ${request.patientId}`,
      priority: isUrgent ? 'high' : 'normal',
      source: requestingServiceId || 'Service inconnu',
      metadata: {
        requestId: request.id,
        anapathId: request.anapathId,
        patientId: request.patientId,
        prescripteurId: dto.prescripteurId,
        chuId: dto.chuId,
        serviceId: dto.serviceId,
        sourceServiceId: requestingServiceId,
        typeExamen: request.typeExamen,
        urgence: dto.urgence,
        alertes: dto.alertes,
      },
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
