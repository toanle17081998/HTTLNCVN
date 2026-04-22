import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { getEnv } from '../../config/env';

export type JwtPayload = {
  email: string;
  exp?: number;
  iat?: number;
  role: string;
  sub: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getEnv().jwt.accessSecret,
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
