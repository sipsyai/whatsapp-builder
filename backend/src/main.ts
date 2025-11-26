import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Enable raw body for webhook signature verification
  });

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://192.168.1.20:5173',
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  });

  // Configure JSON body parser with raw body support
  app.use(json({
    verify: (req: any, res, buf) => {
      req.rawBody = buf;
    },
  }));

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('WhatsApp Builder API')
    .setDescription('API documentation for WhatsApp Builder - Chatbots, WhatsApp Flows, and Messaging')
    .setVersion('1.0')
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

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on: http://0.0.0.0:${port}`);
  console.log(`Swagger API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
