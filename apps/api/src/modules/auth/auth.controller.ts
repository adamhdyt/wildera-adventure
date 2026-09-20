import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import type { RuntimeEnvironment } from '../../common/config/environment';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './auth.types';
import { parseLoginInput } from './login.input';
import { SESSION_COOKIE, sessionCookieOptions } from './session.constants';
import { SessionGuard } from './session.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { token, user } = await this.auth.login(parseLoginInput(body));
    response.cookie(SESSION_COOKIE, token, this.cookieOptions());
    return { success: true, data: { user } };
  }

  @Post('logout')
  @UseGuards(SessionGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout((request as AuthenticatedRequest).admin.id);
    const options = this.cookieOptions();
    delete options.maxAge;
    response.clearCookie(SESSION_COOKIE, options);
  }

  @Get('me')
  @UseGuards(SessionGuard)
  me(@Req() request: Request) {
    const { admin } = request as AuthenticatedRequest;
    return { success: true, data: admin };
  }

  private cookieOptions() {
    return sessionCookieOptions(
      this.config.getOrThrow<RuntimeEnvironment>('NODE_ENV'),
    );
  }
}
