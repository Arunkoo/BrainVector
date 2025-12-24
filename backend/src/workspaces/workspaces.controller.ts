import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WorkspaceService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { AuthGuard } from '@nestjs/passport';
import { type CustomRequest } from 'src/common/types/request.interface';
import { InviteUserDto } from './dto/invite-user.dto';
@Controller('workspace')
@UseGuards(AuthGuard('jwt'))
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  //endpoint for creating a new workspace..
  @Post()
  async createWorkspace(
    @Req() req: CustomRequest,
    @Body() dto: CreateWorkspaceDto,
  ) {
    const userId = req.user.userId;
    try {
      return await this.workspaceService.createWorkspace(userId, dto);
    } catch (error) {
      console.error('Error creating workspace:', error);
      throw new HttpException(
        'Failed to create workspace',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //Endpoint for get all workspace..
  @Get()
  async getUserWorkspace(@Req() req: CustomRequest) {
    const userId = req.user.userId;
    try {
      return await this.workspaceService.getUserWorkspaces(userId);
    } catch (error) {
      console.log('Error fetching workspace', error);
      throw new HttpException(
        'Error while fetching workspace',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  //Endpoint...
  @Post(':workspaceId/invite')
  async inviteUserToWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: InviteUserDto,
  ) {
    try {
      // Resolve email -> userId
      const user = await this.workspaceService.findUserByEmail(
        dto.invitedUserEmail,
      );
      if (!user) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const newMembership = await this.workspaceService.inviteUserToWorkspace(
        workspaceId,
        user.id,
      );

      return { id: newMembership.user.id };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to invite user',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
