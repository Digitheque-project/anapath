import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './notification.entity';
import { NotificationType } from './dto/receive-notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private notificationRepository: Repository<NotificationEntity>,
  ) {}

  async createNotification(data: {
    type: NotificationType | string;
    title: string;
    message: string;
    priority?: string;
    source?: string;
    metadata?: Record<string, any>;
  }) {
    const notification = this.notificationRepository.create({
      type: data.type as NotificationType,
      title: data.title,
      message: data.message,
      priority: data.priority || 'medium',
      source: data.source || 'Anapath',
      metadata: data.metadata || {},
      read: false,
    });
    return this.notificationRepository.save(notification);
  }
}