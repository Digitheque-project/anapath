import { Module } from '@nestjs/common';
import { ExternalController } from './external.controller';
import { AnapathModule } from '../anapath/anapath.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    AnapathModule,      // Pour utiliser AnapathService
    NotificationModule, // Pour utiliser NotificationService
  ],
  controllers: [ExternalController],
})
export class ExternalModule {}