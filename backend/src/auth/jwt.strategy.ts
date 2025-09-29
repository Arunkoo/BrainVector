import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
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

  validate(payload: { userId: string; role: string }) {
    return { userId: payload.userId, role: payload.role };
  }
}
