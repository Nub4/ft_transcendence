import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { MatchModule } from './match/match.module';
import { ChatModule } from './chat/chat.module';
import { GameModule } from './game/game.module';
import { AppGateway } from './app.gateway';
import { getEnvPath } from './common/helper/env.helper';

@Module({
  imports: [
    ConfigModule.forRoot({envFilePath: '../.env', isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      host: process.env.DB_HOST,
      port: 5432,
      username: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
      entities: ['dist/**/*.entity{.ts,.js}'],
      synchronize: true
    }),
    UserModule,
    AuthModule,
    MatchModule,
    ChatModule,
    GameModule
  ],
  controllers: [],
  providers: [AppGateway],
})
export class AppModule {}
