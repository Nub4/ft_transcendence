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
  // require('dotenv').config();
  // console.logprocess.env.JWT_SECRET);
  const corsOptions = {
    origin: ['http://' + process.env.DB_HOST + ':3000', 'http://' + process.env.DB_HOST + ':3001', 'http://' + process.env.DB_HOST + ':3002'],
    credentials: true,
    optionSuccessStatus: 200
  }
  app.use(cors(corsOptions));

  await app.listen(3000);
}
bootstrap();
