import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ReceiveNotificationDto } from './dto/receive-notification.dto';

@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  @Post()
  @HttpCode(HttpStatus.OK)
  async receiveNotification(@Body() notification: ReceiveNotificationDto) {
    this.logger.log(`📨 Notification reçue: ${notification.type} - ${notification.title}`);
    
    console.log('┌─────────────────────────────────────────┐');
    console.log(`│ 📢 TYPE: ${notification.type}`);
    console.log(`│ 📌 TITRE: ${notification.title}`);
    console.log(`│ 💬 MESSAGE: ${notification.message}`);
    if (notification.metadata) {
      console.log(`│ 📦 METADATA: ${JSON.stringify(notification.metadata)}`);
    }
    console.log(`│ 🕐 REÇU LE: ${new Date().toLocaleString()}`);
    console.log('└─────────────────────────────────────────┘');
    
    return {
      success: true,
      message: 'Notification reçue avec succès',
      receivedAt: new Date().toISOString()
    };
  }
}
