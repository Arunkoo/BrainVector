import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { LoginDto } from './dto/login.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from '@nestjs/cache-manager';
import { UserWithoutPassword } from 'src/types/userWithoutPasswordType';

interface JwtPayload {
  userId: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    // Injected cache manager service,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  //finding User By Id using cache Aside pattern..
  async findUserId(userId: string): Promise<UserWithoutPassword | null> {
    const cacheKey = `user_by_id:${userId}`;
    const ttlSeconds = 3600;

    //check caahe..
    const cachedUser = await this.cacheManager.get(cacheKey);
    if (cachedUser) {
      console.log(`[Cache Hit] Serving User ${userId} from Redis.`);
      return JSON.parse(cachedUser as string) as UserWithoutPassword;
    }

    //if not cahche present..
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      return null;
    }

    //saving to cache for next time...
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordhash: _, ...userToCache } = user;

    await this.cacheManager.set(
      cacheKey,
      JSON.stringify(userToCache),
      ttlSeconds * 1000,
    );
    console.log(`[Cache Miss] User ${userId} fetched from DB and cached.`);
    return userToCache as UserWithoutPassword;
  }

  // Generate JWT
  private generateJwt(userId: string, role: string) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }
    return jwt.sign({ userId, role }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
  }

  // Register user
  async register(dto: RegisterDto) {
    const hashPassword = await bcrypt.hash(dto.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          passwordhash: hashPassword,
          role: 'User',
        },
      });

      //cache invalidation..
      await this.cacheManager.del(`user_by_id:${user.id}`);
      console.log(
        `[Cache Invalidation] Cleared cache for new user ${user.id} on register.`,
      );
      const token = this.generateJwt(user.id, user.role);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { passwordhash: _, ...userWithoutPassword } = user;

      return { user: userWithoutPassword, token };
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Email already in use');
      }
      throw error;
    }
  }

  // Login user
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(dto.password, user.passwordhash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    const token = this.generateJwt(user.id, user.role);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordhash: _, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  //verfiy jwt for internal utility  functions....
  verifyJwt(token: string): JwtPayload {
    try {
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        throw new Error('JWT_SECRET environment variable is not defined');
      }

      if (!token || token.trim().length === 0) {
        throw new Error('Token is empty or invalid');
      }

      const payload = jwt.verify(token, jwtSecret) as JwtPayload;

      return payload;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      throw new UnauthorizedException(
        `Invalid or expired JWT token: ${errorMessage}`,
      );
    }
  }
}
