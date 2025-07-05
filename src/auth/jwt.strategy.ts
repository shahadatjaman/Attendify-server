import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          let token = '';
          const authHeader = req.headers['authorization'] || '';

          if (req && authHeader) {
            token = authHeader.replace('Bearer ', '');
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const user = await this.authService.getUserByEmail(payload.email);

    console.log('user', user);
    if (!user) {
      return null;
    }

    return {
      userId: payload.sub,
      username: payload.username,
      roles: user.roles,
    };
  }
}
