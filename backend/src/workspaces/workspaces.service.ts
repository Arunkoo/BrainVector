import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkspaceService {
  constructor(private prisma: PrismaService) {}

  // CREATE WORKSPACE
  async createWorkspace(userId: string, name: string) {
    return this.prisma.workspace.create({
      data: {
        name,
        ownerId: userId,
        members: {
          create: {
            userId: userId,
            role: 'Owner',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });
  }

  // GET USER WORKSPACES
  async getUserWorkspaces(userId: string) {
    const memberships = await this.prisma.workspaceMember.findMany({
      where: {
        userId: userId,
      },
      include: {
        workspace: {
          include: {
            owner: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return memberships.map((membership) => ({
      ...membership.workspace,
      currentUserRole: membership.role,
    }));
  }

  // INVITE USER - ONLY OWNER CAN INVITE
  async inviteUserToWorkspace(
    workspaceId: string,
    userEmail: string,
    inviterId: string,
    role: 'Editor' | 'Viewer' = 'Viewer',
  ) {
    // 1. Check workspace
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    // 2. Check if inviter is owner
    if (workspace.ownerId !== inviterId) {
      throw new ForbiddenException('Only workspace owner can invite users');
    }

    // 3. Find user
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (!user) throw new NotFoundException('User not found');

    // 4. Check if already a member
    const existingMember = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspaceId,
        },
      },
    });
    if (existingMember) {
      throw new ConflictException('User is already a member');
    }

    // 5. Add as member
    return this.prisma.workspaceMember.create({
      data: {
        workspaceId: workspaceId,
        userId: user.id,
        role: role,
        invitedBy: inviterId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // GET WORKSPACE MEMBERS
  async getWorkspaceMembers(workspaceId: string, userId: string) {
    // Check if user is member
    const userMembership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: userId,
          workspaceId: workspaceId,
        },
      },
    });
    if (!userMembership) {
      throw new ForbiddenException('Not a member of this workspace');
    }

    return this.prisma.workspaceMember.findMany({
      where: {
        workspaceId: workspaceId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // UPDATE MEMBER ROLE - ONLY OWNER CAN CHANGE
  async updateMemberRole(
    workspaceId: string,
    memberId: string,
    ownerId: string,
    role: 'Editor' | 'Viewer',
  ) {
    // 1. Check workspace
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    // 2. Check if requester is owner
    if (workspace.ownerId !== ownerId) {
      throw new ForbiddenException('Only workspace owner can update roles');
    }

    // 3. Check if trying to change owner
    if (workspace.ownerId === memberId) {
      throw new ForbiddenException('Cannot change owner role');
    }

    // 4. Update role
    return this.prisma.workspaceMember.update({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId: workspaceId,
        },
      },
      data: {
        role: role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // REMOVE MEMBER - ONLY OWNER CAN REMOVE
  async removeMember(workspaceId: string, memberId: string, ownerId: string) {
    // 1. Check workspace
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    // 2. Check if requester is owner
    if (workspace.ownerId !== ownerId) {
      throw new ForbiddenException('Only workspace owner can remove members');
    }

    // 3. Check if trying to remove owner
    if (workspace.ownerId === memberId) {
      throw new ForbiddenException('Cannot remove workspace owner');
    }

    // 4. Remove member
    await this.prisma.workspaceMember.delete({
      where: {
        userId_workspaceId: {
          userId: memberId,
          workspaceId: workspaceId,
        },
      },
    });

    return { success: true, message: 'Member removed successfully' };
  }

  // CHECK USER PERMISSION IN WORKSPACE
  async getUserWorkspaceRole(userId: string, workspaceId: string) {
    const membership = await this.prisma.workspaceMember.findUnique({
      where: {
        userId_workspaceId: {
          userId: userId,
          workspaceId: workspaceId,
        },
      },
      select: {
        role: true,
      },
    });

    return membership?.role || null;
  }
}
