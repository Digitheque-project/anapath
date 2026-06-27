import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnapathService } from './anapath.service';
import { AnapathController } from './anapath.controller';
import { AnapathRequest } from './entities/anapath-request.entity';
import { ChuClient } from '../common/clients/chu.client';
import { NotificationClient } from '../common/clients/notification.client';

@Module({
  imports: [TypeOrmModule.forFeature([AnapathRequest])],
  controllers: [AnapathController],
  providers: [AnapathService, NotificationClient, ChuClient],
  exports: [AnapathService],
})
export class AnapathModule {}