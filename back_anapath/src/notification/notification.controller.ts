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
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ReceiveNotificationDto } from './dto/receive-notification.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationEntity } from './notification.entity';
import { ServiceNotificationInboundDto } from './dto/service-notification-inbound.dto';
import {
  isServiceNotificationPayload,
  mapServiceNotificationInbound,
} from './map-service-notification';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private notificationRepository: Repository<NotificationEntity>,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: false, transform: true }))
  @ApiOperation({
    summary: 'Recevoir une notification (format Anapath ou service-notification)',
  })
  @ApiResponse({ status: 200, description: 'Notification reçue avec succès' })
  @HttpCode(HttpStatus.OK)
  async receiveNotification(@Body() body: Record<string, unknown>) {
    const data = isServiceNotificationPayload(body)
      ? mapServiceNotificationInbound(body as unknown as ServiceNotificationInboundDto)
      : this.parseAnapathNotification(body);

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

  @Get('unread/count')
  @ApiOperation({ summary: 'Compter les notifications non lues' })
  async getUnreadCount() {
    const count = await this.notificationRepository.count({ where: { read: false } });
    return { count };
  }

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

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  async markAsRead(@Param('id') id: string) {
    await this.notificationRepository.update(id, { read: true });
    return { success: true };
  }
}