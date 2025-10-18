import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { WorkspaceModule } from './workspaces/workspaces.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
import { DocumentModule } from './documents/document.module';
import { RealTimeModule } from './real-Time/real-Time.module';

@Module({
  imports: [
    //load configuration from .env files golbally..
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    //2. stepup caching using Redis Store..
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (ConfigService: ConfigService) => ({
        store: redisStore,
        host: ConfigService.get<string>('redis_Host') || 'localhost',
        port: ConfigService.get<number>('redis_Port') || 6379,
        ttl: 1000 * 60 * 5,
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    WorkspaceModule,
    DocumentModule,
    RealTimeModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
