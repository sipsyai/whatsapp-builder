import { config } from 'dotenv';
// Load environment variables FIRST before anything else
config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for webhook signature verification
    logger: isProduction ? ['error', 'warn', 'log'] : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Disable x-powered-by header for security
  app.getHttpAdapter().getInstance().disable('x-powered-by');

  // CORS configuration - use FRONTEND_URL in production
  const allowedOrigins = isProduction
    ? [process.env.FRONTEND_URL].filter(Boolean)
    : [
        'http://localhost:5173',
        'http://192.168.1.20:5173',
        process.env.FRONTEND_URL,
      ].filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-hub-signature-256'],
  });

  // Configure JSON body parser with raw body support
  app.use(json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  }));

  // Swagger API Documentation - only in development
  if (!isProduction) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('WhatsApp Builder API')
      .setDescription('API documentation for WhatsApp Builder - Chatbots, WhatsApp Flows, and Messaging')
      .setVersion('1.0')
      .addTag('Health', 'Health check endpoints')
      .addTag('Chatbots', 'Chatbot management and configuration')
      .addTag('Flows', 'WhatsApp Flow management')
      .addTag('WhatsApp Config', 'WhatsApp Business API configuration')
      .addTag('Flow Endpoint', 'WhatsApp Flow data exchange endpoint')
      .addTag('Chatbot Webhook', 'Chatbot webhook for encrypted data exchange')
      .addTag('Conversations', 'Conversation management')
      .addTag('Messages', 'Message management')
      .addTag('Users', 'User management')
      .addTag('Media', 'Media file management')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });

    logger.log('Swagger documentation available at /api/docs');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  logger.log(`Application is running on port ${port}`);
  logger.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  if (!isProduction) {
    logger.log(`Swagger API Documentation: http://localhost:${port}/api/docs`);
  }
}
bootstrap();
