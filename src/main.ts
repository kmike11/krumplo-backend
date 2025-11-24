import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: (process.env.FRONTEND_ORIGIN ?? '').split(',').filter(Boolean)
      .length
      ? (process.env.FRONTEND_ORIGIN ?? '')
          .split(',')
          .map((origin) => origin.trim())
      : true,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidUnknownValues: false,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Workboard API')
    .setDescription('Hybrid Trello / Jira board management API')
    .setVersion('1.0.0')
    .addBearerAuth({ type: 'http', bearerFormat: 'JWT' })
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, swaggerDocument, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

bootstrap().catch((error) => {
  console.error('Failed to start Nest application', error);
  process.exitCode = 1;
});
