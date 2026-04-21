import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';

import { getEnv } from '../../config/env';
import type { JwtPayload } from '../../common/strategies/jwt.strategy';
import { AuthRepository } from './auth.repository';
import type { AuthTokens, LoginDto, RefreshDto } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.authRepository.findByEmail(dto.email);

    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Email hoặc mật khẩu không đúng.',
      });
    }

    if (user.status === 'suspended') {
      throw new UnauthorizedException({
        code: 'ACCOUNT_SUSPENDED',
        message: 'Tài khoản của bạn đã bị tạm khóa.',
      });
    }

    return this.signTokens({ email: user.email, role: user.role.name, sub: user.id });
  }

  async refresh(dto: RefreshDto): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify<JwtPayload>(dto.refreshToken, {
        secret: getEnv().jwt.refreshSecret,
      });

      const user = await this.authRepository.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException();
      }

      return this.signTokens({ email: user.email, role: user.role.name, sub: user.id });
    } catch {
      throw new UnauthorizedException({
        code: 'INVALID_REFRESH_TOKEN',
        message: 'Refresh token không hợp lệ hoặc đã hết hạn.',
      });
    }
  }

  private signTokens(payload: JwtPayload): AuthTokens {
    const env = getEnv().jwt;

    return {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      accessToken: this.jwtService.sign(payload as any, {
        expiresIn: env.accessExpiresIn as any,
        secret: env.accessSecret,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      refreshToken: this.jwtService.sign(payload as any, {
        expiresIn: env.refreshExpiresIn as any,
        secret: env.refreshSecret,
      }),
    };
  }
}
