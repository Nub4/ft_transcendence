import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new TransformInterceptor());
  app.use(cookieParser());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(new Reflector()));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  
  const cors = require('cors');
  const corsOptions = {
    origin: ["http://127.0.0.1:3000", "http://localhost:3000", "http://127.0.0.1:3001", "http://localhost:3001", "http://127.0.0.1:3002", "http://localhost:3002", 'http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
    optionSuccessStatus: 200
  }
  app.use(cors(corsOptions));

  await app.listen(3000);
}
bootstrap();
