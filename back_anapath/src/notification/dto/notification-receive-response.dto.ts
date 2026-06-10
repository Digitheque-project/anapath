import { ApiProperty } from '@nestjs/swagger';

export class NotificationReceiveResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Notification reçue avec succès' })
  message: string;

  @ApiProperty({ example: '2026-06-10T12:00:00.000Z' })
  receivedAt: string;

  @ApiProperty({ example: '82bf4bac-76ce-44ee-8d74-7d6cbfc91f5c' })
  id: string;
}
