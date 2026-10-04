import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── Global Validation Pipe ─────────────────────────────────────────────────
  // Automatically validates incoming requests using class-validator DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if unknown properties exist
      transform: true,        // Auto-transform payload to DTO class instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── CORS ───────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5500',
    credentials: true,
  });

  // ─── Global API Prefix ──────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Serve Static Uploads ───────────────────────────────────────────────────
  // Allows direct browser access to uploaded product images via http://localhost:3000/uploads/...
  const express = (await import('express')).default;
  const path = await import('path');
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🎵 Lossless-shop API is running on: http://localhost:${port}/api/v1`);
}
await bootstrap();
