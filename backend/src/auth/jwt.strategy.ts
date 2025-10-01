import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    const JwtSecret = process.env.JWT_SECRET;
    if (!JwtSecret) {
      throw new Error('JWT_SECRET environment variable is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request): string | null =>
          typeof req?.cookies?.jwt === 'string' ? req.cookies.jwt : null, // Read token from cookie
      ]),
      secretOrKey: JwtSecret,
    });
  }
  // Adding cached lookup in to validate and reteruve user details.
  async validate(payload: { userId: string; role: string }) {
    const user = await this.authService.findUserId(payload.userId);
    if (!user) {
      throw new UnauthorizedException('Invalid token or user not found');
    }
    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
