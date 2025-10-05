import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserWithoutPassword } from 'src/types/userWithoutPasswordType';

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
          include: { user: true },
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
          include: { owner: true },
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

  // Inviting a new user to our workspace...
  async inviteUserToWorkspace(workspaceId: string, inviteUserId: string) {
    const invitedUserCacheKey = `user_workspaces:${inviteUserId}`;
    await this.cacheManager.del(invitedUserCacheKey);
    console.log(
      `[Cache Invalidation] Cleared workspace list for invited user ${inviteUserId}.`,
    );

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
