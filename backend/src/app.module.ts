import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { WorkspaceModule } from './workspaces/workspaces.module';
import { CacheModule } from '@nestjs/cache-manager';
import { DocumentModule } from './documents/document.module';
import { RealTimeModule } from './real-Time/real-Time.module';
import { Redis } from '@upstash/redis';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        if (process.env.NODE_ENV === 'production') {
          const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL!,
            token: process.env.UPSTASH_REDIS_REST_TOKEN!,
          });

          return {
            store: {
              get: (key: string) => redis.get(key),
              set: (key: string, value: any, options?: { ttl?: number }) =>
                redis.set(
                  key,
                  value,
                  options?.ttl ? { ex: options.ttl } : undefined,
                ),
              del: (key: string) => redis.del(key),
            },
            ttl: 60 * 5,
          };
        }

        // ✅ Local Redis via Docker
        const host = process.env.REDIS_HOST || 'redis';
        const port = parseInt(process.env.REDIS_PORT || '6379', 10);

        return {
          store: await redisStore({
            // Adding socket property for better compatibility
            socket: {
              host: host,
              port: port,
            },
            // If socket doesn't work for your version, keep these as fallback
            host: host,
            port: port,
            ttl: 60 * 5,
          }),
        };
      },
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    WorkspaceModule,
    DocumentModule,
    RealTimeModule,
  ],
})
export class AppModule {}
