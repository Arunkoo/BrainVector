import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { LoginDto } from './dto/login.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

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
}
