import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';

import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { AnapathService } from '../anapath/anapath.service';

import {

  CreatePrescriptionAnapathDto,

  ExamenTypeExterne,

  UrgenceLevel,

} from './dto/create-prescription-anapath.dto';

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

  async createFromPrescription(@Body() dto: CreatePrescriptionAnapathDto) {

    const data = dto.data || {};

    const isExtemporane =

      dto.urgence === UrgenceLevel.STAT ||

      dto.typeExamen === ExamenTypeExterne.EXTEMPORANE_STAT;



    const prelevement = this.mapToPrelevement(dto.typeExamen, data, dto.alertes);



    const request = await this.anapathService.create({

      patientId: dto.patientId,

      episodeId: dto.serviceId,

      prescriptionId: dto.prescriptionId,

      typeExamen: dto.typeExamen as unknown as ExamenType,

      isExtemporane,

      prelevement,

    });



    const isUrgent =

      dto.urgence === UrgenceLevel.STAT || dto.urgence === UrgenceLevel.URGENTE;



    await this.notificationService.createNotification({

      type: isExtemporane ? 'STAT_ALERT' : 'INFO',

      title: isExtemporane ? '🚨 Nouvelle prescription Anapath STAT' : 'Nouvelle prescription Anapath',

      message: `Prescription ${request.anapathId} reçue pour le patient ${request.patientId}`,

      priority: isUrgent ? 'high' : 'medium',

      source: dto.serviceId || 'Service prescripteur',

      metadata: {

        requestId: request.id,

        anapathId: request.anapathId,

        patientId: request.patientId,

        prescripteurId: dto.prescripteurId,

        prescriptionId: dto.prescriptionId,

        chuId: dto.chuId,

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

      case ExamenTypeExterne.BIOPSIE:

        prelevement = {

          site: data?.organe || 'Non spécifié',

          description: `Organe: ${data?.organe || '-'}, Localisation: ${data?.localisation || '-'}, Nature: ${data?.nature || '-'}, Fixateur: ${data?.fixateur || '-'}`,

        };

        break;

      case ExamenTypeExterne.FCV_PAP:

        prelevement = {

          site: 'Col utérin',

          description: `État du col: ${data?.etat_col || 'Non spécifié'}`,

        };

        break;

      case ExamenTypeExterne.LIQUIDE:

        prelevement = {

          site: 'Liquide biologique',

          description: `Type: ${data?.type_liquide || '-'}, Volume: ${data?.volume || '-'}`,

        };

        break;

      case ExamenTypeExterne.CYT0PONCTION:

        prelevement = {

          site: data?.site || data?.organe || 'Non spécifié',

          description: `Cytoponction - Site: ${data?.site || data?.organe || '-'}, Nature: ${data?.nature || '-'}`,

        };

        break;

      case ExamenTypeExterne.EXTEMPORANE_STAT:

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


