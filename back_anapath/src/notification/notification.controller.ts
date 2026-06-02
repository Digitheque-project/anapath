import { Controller, Post, Body, Get, Patch, Param, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ReceiveNotificationDto } from './dto/receive-notification.dto';
import { NotificationResponseDto } from './dto/notification-response.dto';
import { NotificationEntity } from './notification.entity';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(
    @InjectRepository(NotificationEntity)
    private notificationRepository: Repository<NotificationEntity>,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Recevoir une notification externe' })
  @ApiBody({ type: ReceiveNotificationDto })
  @ApiResponse({ status: 200, description: 'Notification reçue avec succès' })
  @HttpCode(HttpStatus.OK)
  async receiveNotification(@Body() notificationData: ReceiveNotificationDto) {
    this.logger.log(`📨 Notification reçue: ${notificationData.type} - ${notificationData.title}`);
    
    // Sauvegarder la notification en base
    const notification = this.notificationRepository.create({
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      priority: notificationData.priority || 'medium',
      source: notificationData.source,
      metadata: notificationData.metadata,
      read: false,
    });
    
    await this.notificationRepository.save(notification);
    
    return {
      success: true,
      message: 'Notification reçue avec succès',
      receivedAt: new Date().toISOString(),
      id: notification.id
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