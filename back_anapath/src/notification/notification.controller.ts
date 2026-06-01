import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ReceiveNotificationDto } from './dto/receive-notification.dto';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  @Post()
  @ApiOperation({ summary: 'Recevoir une notification externe' })
  @ApiBody({ type: ReceiveNotificationDto })
  @ApiResponse({ status: 200, description: 'Notification reçue avec succès' })
  @HttpCode(HttpStatus.OK)
  async receiveNotification(@Body() notification: ReceiveNotificationDto) {
    this.logger.log(`📨 Notification reçue: ${notification.type} - ${notification.title}`);
    return {
      success: true,
      message: 'Notification reçue avec succès',
      receivedAt: new Date().toISOString()
    };
  }
}