import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  //createWorkspace...
  async createWorkspace(userId: string, dto: CreateWorkspaceDto) {
    return this.prisma.workspace.create({
      data: {
        name: dto.name,
        owner: { connect: { id: userId } },
        members: {
          create: {
            user: { connect: { id: userId } },
            role: 'Owner',
          },
        },
      },

      include: {
        members: {
          include: { user: true },
        },
      },
    });
  }

  //Finds All workspace that a specific user is a member of..
  async getUserWorkspaces(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: {
        userId: userId,
      },
      include: {
        workspace: {
          include: { owner: true },
        },
      },
    });

    if (!memberships.length) {
      return [];
    }
    return memberships;
  }

  // Inviting a new user to our workspace...
  async inviteUserToWorkspace(workspaceId: string, inviteUserId: string) {
    //check workspace exits..
    const workspaceExists = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspaceExists) {
      throw new NotFoundException('Workspace not found');
    }

    //check user exists
    const userExists = await this.prisma.user.findUnique({
      where: { id: inviteUserId },
    });
    if (!userExists) {
      throw new NotFoundException('Invited User not found');
    }

    //check if user alredy a member of a workspace..
    const existingMembership = await this.prisma.workspaceMember.findFirst({
      where: {
        userId: inviteUserId,
        WorkspaceId: workspaceId,
      },
    });
    if (existingMembership) {
      throw new ConflictException(
        'User is already a member of this workspace.',
      );
    }

    //if everything is fine means a fresh user..
    return this.prisma.workspaceMember.create({
      data: {
        workspace: { connect: { id: workspaceId } },
        user: { connect: { id: inviteUserId } },
      },
      include: {
        user: true,
      },
    });
  }
}
