import { Module } from '@nestjs/common';
import { ExternalController } from './external.controller';
import { ExternalService } from './external.service';
import { AnapathModule } from '../anapath/anapath.module';
import { ChuClient } from '../common/clients/chu.client';
import { AccueilClient } from '../common/clients/accueil.client';

@Module({
  imports: [AnapathModule],
  controllers: [ExternalController],
  providers: [ExternalService, ChuClient, AccueilClient],
})
export class ExternalModule {}
