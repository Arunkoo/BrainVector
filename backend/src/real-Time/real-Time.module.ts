import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { DocumentModule } from 'src/documents/document.module';
import { WorkspaceModule } from 'src/workspaces/workspaces.module';
import { RealTimeGateWay } from './real-Time.gateway';

@Module({
  imports: [AuthModule, DocumentModule, WorkspaceModule],
  providers: [RealTimeGateWay],
})
export class RealTimeModule {}
