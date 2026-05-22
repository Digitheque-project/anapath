import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnapathService } from './anapath.service';
import { AnapathController } from './anapath.controller';
import { AnapathRequest } from './entities/anapath-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AnapathRequest])],
  controllers: [AnapathController],
  providers: [AnapathService],
})
export class AnapathModule {}
