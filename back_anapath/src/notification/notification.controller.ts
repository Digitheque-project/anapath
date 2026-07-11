import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
  Logger,
  BadRequestException,
  UsePipes,
  ValidationPipe,
  Headers,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ReceiveNotificationDto } from './dto/receive-notification.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationReceiveResponseDto } from './dto/notification-receive-response.dto';
import { NotificationEntity } from './notification.entity';
import { ServiceNotificationInboundDto } from './dto/service-notification-inbound.dto';
import {
  isServiceNotificationPayload,
  mapServiceNotificationInbound,
} from './map-service-notification';
import { Public } from '../auth/decorators/public.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private notificationRepository: Repository<NotificationEntity>,
  ) {}

  @Public()
  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }))
  @ApiOperation({
    summary: 'Recevoir une notification',
    description:
      'Accepte le format standard service-notification (recommandé) ou le format legacy Anapath `{ type, title, message }`.',
  })
  @ApiBody({
    type: ServiceNotificationInboundDto,
    description: 'Corps de requête au format standard service-notification',
    examples: {
      standard: {
        summary: 'Format standard (recommandé)',
        description: 'Format aligné avec tous les services de notification',
        value: {
          type: 'MEDICAL_ALERT',
          motif: 'Patient en détresse',
          sourceServiceId: 'service-anapath',
          sourceServiceName: 'Anapath',
          targetServiceId: 'service-urgence',
          targetServiceName: 'Urgence',
          urgence: 2,
          patientId: 'patient-123',
          payload: {
            dossier: 'ANP-456',
            observation: 'Résultat anatomopathologique disponible',
          },
          channels: ['SOUND', 'WEB'],
        },
      },
      legacyAnapath: {
        summary: 'Format legacy Anapath',
        description: 'Format interne historique (type, title, message)',
        value: {
          type: 'STAT_ALERT',
          title: '🚨 ALERTE STAT',
          message: 'Examen extemporané urgent - délai 30 minutes',
          priority: 'high',
          source: 'service-notification',
          metadata: { anapathId: 'ANP-2026-12345' },
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Notification reçue avec succès',
    type: NotificationReceiveResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Corps de requête invalide' })
  @HttpCode(HttpStatus.OK)
  async receiveNotification(
    @Body() body: Record<string, unknown>,
    @Headers('x-service-id') serviceIdHeader?: string,
  ) {
    const data = isServiceNotificationPayload(body)
      ? mapServiceNotificationInbound(body as unknown as ServiceNotificationInboundDto)
      : this.parseAnapathNotification(body);

    if (serviceIdHeader) {
      data.source = serviceIdHeader;
      data.metadata = {
        ...(data.metadata ?? {}),
        sourceServiceId: serviceIdHeader,
        serviceId: serviceIdHeader,
      };
    }

    this.logger.log(`📨 Notification reçue: ${data.type} - ${data.title}`);

    const notification = this.notificationRepository.create(data);
    await this.notificationRepository.save(notification);

    return {
      success: true,
      message: 'Notification reçue avec succès',
      receivedAt: new Date().toISOString(),
      id: notification.id,
    };
  }

  private parseAnapathNotification(body: Record<string, unknown>) {
    const type = body.type as string | undefined;
    const title = body.title as string | undefined;
    const message = body.message as string | undefined;

    if (!type || !title || !message) {
      throw new BadRequestException(
        'Format invalide : attendu { type, title, message } ou format service-notification { type, motif, targetServiceId, sourceServiceId }',
      );
    }

    return {
      type: type as ReceiveNotificationDto['type'],
      title,
      message,
      priority: (body.priority as string) || 'medium',
      source: body.source as string | undefined,
      metadata: body.metadata as Record<string, unknown> | undefined,
      read: false,
    };
  }

  @Permissions('anapath:read')
  @Get()
  @ApiOperation({ summary: 'Lister toutes les notifications' })
  @ApiResponse({ status: 200, description: 'Liste des notifications', type: [NotificationResponseDto] })
  async getAllNotifications() {
    const notifications = await this.notificationRepository.find({
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return notifications;
  }

  @Permissions('anapath:read')
  @Get('unread/count')
  @ApiOperation({ summary: 'Compter les notifications non lues' })
  async getUnreadCount() {
    const count = await this.notificationRepository.count({ where: { read: false } });
    return { count };
  }

  @Permissions('anapath:update')
  @Patch('read-all')
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues' })
  async markAllAsRead() {
    await this.notificationRepository
      .createQueryBuilder()
      .update(NotificationEntity)
      .set({ read: true })
      .where('read = :read', { read: false })
      .execute();
    return { success: true };
  }

  @Permissions('anapath:update')
  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  async markAsRead(@Param('id') id: string) {
    await this.notificationRepository.update(id, { read: true });
    return { success: true };
  }
}