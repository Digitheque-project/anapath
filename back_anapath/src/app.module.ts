import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnapathModule } from './anapath/anapath.module';
import { NotificationModule } from './notification/notification.module';
import { ExternalModule } from './external/external.module';
import { AnapathRequest } from './anapath/entities/anapath-request.entity';
import { NotificationEntity } from './notification/notification.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: parseInt(config.get('DB_PORT') ?? '5432', 10),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [AnapathRequest, NotificationEntity],
        synchronize: true,
        ssl: { rejectUnauthorized: false },
      }),
      inject: [ConfigService],
    }),
    AnapathModule,
    NotificationModule,
    ExternalModule, // ← Ajout du module externe
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}