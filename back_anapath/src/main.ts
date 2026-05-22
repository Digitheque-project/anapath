import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { Utf8Interceptor } from './common/interceptors/utf8.interceptor';
import { Utf8Pipe } from './common/pipes/utf8.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
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
  
  // Configuration Swagger
  const config = new DocumentBuilder()
    .setTitle('API Anapath')
    .setDescription('API pour la gestion des examens d\'anatomie pathologique')
    .setVersion('1.0')
    .addTag('anapath', 'Endpoints pour les demandes d\'examen')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = process.env.PORT || 3001;
  await app.listen(port);
  
  console.log(`🚀 Backend Anapath démarré sur http://localhost:${port}`);
  console.log(`📚 Documentation Swagger disponible sur http://localhost:${port}/api/docs`);
}
bootstrap();