import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { LoginUseCase, RefreshTokenUseCase, RevokeTokenUseCase } from '../../application/auth/auth.use-cases';
import { Public } from '../../common/decorators/public.decorator';
import { getRefreshTokenCookieOptions } from '../../common/utils/cookie.util';
import { LoginDto } from '../dto/auth/login.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly revokeTokenUseCase: RevokeTokenUseCase,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.loginUseCase.execute(loginDto);

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
    const result = await this.refreshTokenUseCase.execute(request.cookies?.refreshToken);

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
    await this.revokeTokenUseCase.execute(request.cookies?.refreshToken);

    response.clearCookie('refreshToken', {
      ...getRefreshTokenCookieOptions(this.configService),
      maxAge: undefined,
    });
  }
}
