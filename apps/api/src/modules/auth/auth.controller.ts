import { Body, Controller, Get, HttpCode, HttpStatus, Post, Request } from '@nestjs/common';

import { Public } from '../../common/decorators/public.decorator';
import type { JwtPayload } from '../../common/strategies/jwt.strategy';
import { AuthService } from './auth.service';
import type { AuthTokens, AuthUser, ChangePasswordDto, LoginDto, RefreshDto } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthTokens> {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto): Promise<AuthTokens> {
    return this.authService.refresh(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(): { message: string } {
    return { message: 'Logged out successfully.' };
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Request() req: { user: JwtPayload },
    @Body() dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(req.user.sub, dto);
  }

  @Get('me')
  me(@Request() req: { user: JwtPayload }): Promise<AuthUser> {
    return this.authService.me(req.user.sub);
  }
}
