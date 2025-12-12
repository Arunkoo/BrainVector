import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { WorkspaceService } from './workspaces.service';

interface CustomRequest extends Request {
  user: {
    userId: string;
    email: string;
  };
}

@Controller('workspaces')
@UseGuards(AuthGuard('jwt'))
export class WorkspaceController {
  constructor(private workspaceService: WorkspaceService) {}

  // CREATE WORKSPACE
  @Post()
  async createWorkspace(
    @Req() req: CustomRequest,
    @Body() body: { name: string },
  ) {
    return this.workspaceService.createWorkspace(req.user.userId, body.name);
  }

  // GET USER WORKSPACES
  @Get()
  async getUserWorkspaces(@Req() req: CustomRequest) {
    return this.workspaceService.getUserWorkspaces(req.user.userId);
  }

  // INVITE USER
  @Post(':workspaceId/invite')
  async inviteUser(
    @Param('workspaceId') workspaceId: string,
    @Req() req: CustomRequest,
    @Body() body: { email: string; role?: 'Editor' | 'Viewer' },
  ) {
    return this.workspaceService.inviteUserToWorkspace(
      workspaceId,
      body.email,
      req.user.userId,
      body.role || 'Viewer',
    );
  }

  // GET WORKSPACE MEMBERS
  @Get(':workspaceId/members')
  async getWorkspaceMembers(
    @Param('workspaceId') workspaceId: string,
    @Req() req: CustomRequest,
  ) {
    return this.workspaceService.getWorkspaceMembers(
      workspaceId,
      req.user.userId,
    );
  }

  // UPDATE MEMBER ROLE
  @Put(':workspaceId/members/:memberId/role')
  async updateMemberRole(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @Req() req: CustomRequest,
    @Body() body: { role: 'Editor' | 'Viewer' },
  ) {
    return this.workspaceService.updateMemberRole(
      workspaceId,
      memberId,
      req.user.userId,
      body.role,
    );
  }

  // REMOVE MEMBER
  @Delete(':workspaceId/members/:memberId')
  async removeMember(
    @Param('workspaceId') workspaceId: string,
    @Param('memberId') memberId: string,
    @Req() req: CustomRequest,
  ) {
    return this.workspaceService.removeMember(
      workspaceId,
      memberId,
      req.user.userId,
    );
  }

  // CHECK PERMISSION
  @Get(':workspaceId/permission')
  async getPermission(
    @Param('workspaceId') workspaceId: string,
    @Req() req: CustomRequest,
  ) {
    const role = await this.workspaceService.getUserWorkspaceRole(
      req.user.userId,
      workspaceId,
    );
    return { role };
  }
}
