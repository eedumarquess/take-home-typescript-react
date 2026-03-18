import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { getRefreshTokenCookieOptions } from '../../common/utils/cookie.util';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(loginDto);

    response.cookie(
      'refreshToken',
      result.refreshToken,
      getRefreshTokenCookieOptions(this.configService),
    );

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.refresh(request.cookies?.refreshToken);

    response.cookie(
      'refreshToken',
      result.refreshToken,
      getRefreshTokenCookieOptions(this.configService),
    );

    return {
      accessToken: result.accessToken,
    };
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(request.cookies?.refreshToken);

    response.clearCookie('refreshToken', {
      ...getRefreshTokenCookieOptions(this.configService),
      maxAge: undefined,
    });
  }
}
