import { Module } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { WorkspaceService } from './workspaces.service';
import { WorkspaceController } from './workspaces.controller';

@Module({
  // The controllers array registers the controllers for this module.
  controllers: [WorkspaceController],
  // The providers array registers the services that will be used by other parts of the module.
  providers: [WorkspaceService, PrismaService],
})
export class WorkspaceModule {}
