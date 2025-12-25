import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import type { UserWithoutPassword } from 'src/types/userWithoutPasswordType';
import { WorkspaceRole } from '@prisma/client';

@Injectable()
export class WorkspaceService {
  constructor(
    private prisma: PrismaService,
    //Inject the cache..
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  //createWorkspace...
  async createWorkspace(userId: string, dto: CreateWorkspaceDto) {
    //Cache Invalidation...
    const cacheKey = `user_workspace:${userId}`;
    await this.cacheManager.del(cacheKey);
    console.log(
      `[Cache Invalidation] Cleared workspace list for user ${userId}`,
    );
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });
  }

  //Finds All workspace that a specific user is a member of..
  async getUserWorkspaces(userId: string) {
    const cacheKey = `user_workspace:${userId}`;
    const ttlSecond = 300;

    //read from cache..
    const cachedData = await this.cacheManager.get(cacheKey);
    if (cachedData) {
      console.log(
        `[Cache Hit] Serving workspaces for user ${userId} from Redis.`,
      );
      return JSON.parse(cachedData as string) as UserWithoutPassword;
    }
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
                role: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });
    //setting data to cache before returning..
    await this.cacheManager.set(
      cacheKey,
      JSON.stringify(memberships),
      ttlSecond * 1000,
    );
    console.log(
      `[Cache Miss] Serving workspaces for user ${userId} from DB and caching.`,
    );
    if (!memberships.length) {
      return [];
    }
    return memberships;
  }

  async findUserByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  // Inviting a new user to our workspace...
  async inviteUserToWorkspace(
    workspaceId: string,
    inviterId: string,
    inviteUserId: string,
    role: WorkspaceRole,
  ) {
    // 1️⃣ Check inviter membership
    const inviterMembership = await this.prisma.workspaceMember.findFirst({
      where: {
        WorkspaceId: workspaceId,
        userId: inviterId,
      },
    });

    if (!inviterMembership || inviterMembership.role === 'Viewer') {
      throw new ConflictException('You are not allowed to invite users');
    }

    // 2️⃣ Prevent Owner invite
    if (role === 'Owner') {
      throw new ConflictException('Cannot invite user as Owner');
    }

    // 3️⃣ Prevent duplicate membership
    const existingMembership = await this.prisma.workspaceMember.findFirst({
      where: {
        WorkspaceId: workspaceId,
        userId: inviteUserId,
      },
    });

    if (existingMembership) {
      throw new ConflictException('User already exists in workspace');
    }

    // 4️⃣ Create membership (DEFAULT Viewer if frontend sends Viewer)
    const membership = this.prisma.workspaceMember.create({
      data: {
        workspace: { connect: { id: workspaceId } },
        user: { connect: { id: inviteUserId } },
        role: role ?? WorkspaceRole.Viewer, // ✅ SAFE DEFAULT
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

    await this.cacheManager.del(`user_workspace:${inviterId}`);
    await this.cacheManager.del(`user_workspace:${inviteUserId}`);
    return membership;
  }
}
