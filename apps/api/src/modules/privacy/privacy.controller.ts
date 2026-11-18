import { Controller, Get, Header, Request } from '@nestjs/common';

import type { JwtPayload } from '../../common/strategies/jwt.strategy';
import { PrivacyService } from './privacy.service';

@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Get('export')
  @Header('Cache-Control', 'no-store')
  exportMyData(@Request() req: { user: JwtPayload }) {
    return this.privacyService.exportUserData(req.user.sub);
  }
}

