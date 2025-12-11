import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import type { UserWithoutPassword } from 'src/types/userWithoutPasswordType';

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

  // Inviting a new user to our workspace...
  async inviteUserByEmail(workspaceId: string, userEmail: string) {
    // 1) Workspace exists?
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    // 2) User exists?
    const user = await this.prisma.user.findUnique({
      where: { email: userEmail },
    });
    if (!user) throw new NotFoundException('User not found');

    // 3) Check if already member
    const existing = await this.prisma.workspaceMember.findFirst({
      where: {
        userId: user.id,
        WorkspaceId: workspaceId, // FIXED
      },
    });

    if (existing) {
      throw new ConflictException('User already a member');
    }

    // 4) Invalidate correct cache
    const invitedUserCacheKey = `user_workspace:${user.id}`;
    await this.cacheManager.del(invitedUserCacheKey);

    // 5) Create membership
    return await this.prisma.workspaceMember.create({
      data: {
        WorkspaceId: workspaceId,
        userId: user.id,
      },
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
    });
  }
}
