import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { WorkspaceModule } from './workspaces/workspaces.module';

@Module({
  imports: [PrismaModule, UserModule, AuthModule, WorkspaceModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
