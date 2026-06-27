import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Utf8Interceptor } from './common/interceptors/utf8.interceptor';
import { Utf8Pipe } from './common/pipes/utf8.pipe';
import { ChuClient } from './common/clients/chu.client';

const ANAPATH_SERVICE_ID =
  process.env.ANAPATH_SERVICE_ID ?? '66e6d562-a772-40f1-a19a-d3385d862419';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configuredOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
    : [];

  const corsOrigins = [
    ...new Set([
      ...configuredOrigins,
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:3001',
    ]),
  ].filter(Boolean);

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  app.useGlobalPipes(new Utf8Pipe());
  app.useGlobalInterceptors(new Utf8Interceptor());
  
  app.setGlobalPrefix('api');
  
  // --- Configuration Swagger ---
  const config = new DocumentBuilder()
    .setTitle('API Anapath')
    .setDescription('API pour la gestion des examens d\'anatomie pathologique')
    .setVersion('1.0')
    .addTag('anapath', 'Endpoints pour les demandes d\'examen')
    .addTag('notifications', 'Endpoints pour recevoir des notifications')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = process.env.PORT || 3001;
  await app.listen(port);

  const chuClient = new ChuClient();
  const serviceInfo = await chuClient.getAnapathServiceInfo();
  if (serviceInfo) {
    console.log(`✅ Service connecté : ${serviceInfo.name} (ID: ${ANAPATH_SERVICE_ID})`);
  } else {
    console.warn('⚠️ Service CHU indisponible au démarrage - mode dégradé');
  }

  console.log(`🚀 Backend Anapath démarré sur http://localhost:${port}`);
  console.log(`📚 Documentation Swagger disponible sur http://localhost:${port}/api/docs`);
}
bootstrap();