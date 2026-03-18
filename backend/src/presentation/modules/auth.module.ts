import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import {
  LoginUseCase,
  RefreshTokenUseCase,
  RevokeTokenUseCase,
} from '../../application/auth/auth.use-cases';
import { APPLICATION_TOKENS } from '../../application/tokens';
import { BcryptPasswordHasher } from '../../infrastructure/auth/bcrypt-password-hasher';
import { JwtTokenService } from '../../infrastructure/auth/jwt-token.service';
import { PrismaRefreshSessionRepository } from '../../infrastructure/prisma/prisma-refresh-session.repository';
import { PrismaUserRepository } from '../../infrastructure/prisma/prisma-user.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthController } from '../controllers/auth.controller';

@Module({
  controllers: [AuthController],
  exports: [JwtModule],
  imports: [ConfigModule, JwtModule.register({}), PrismaModule],
  providers: [
    {
      provide: APPLICATION_TOKENS.USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
    {
      provide: APPLICATION_TOKENS.REFRESH_SESSION_REPOSITORY,
      useClass: PrismaRefreshSessionRepository,
    },
    {
      provide: APPLICATION_TOKENS.TOKEN_SERVICE,
      useClass: JwtTokenService,
    },
    {
      provide: APPLICATION_TOKENS.PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
    {
      provide: LoginUseCase,
      useFactory: (
        usersRepository: PrismaUserRepository,
        passwordHasher: BcryptPasswordHasher,
        tokenService: JwtTokenService,
        refreshSessionRepository: PrismaRefreshSessionRepository,
      ) =>
        new LoginUseCase(usersRepository, passwordHasher, tokenService, refreshSessionRepository),
      inject: [
        APPLICATION_TOKENS.USER_REPOSITORY,
        APPLICATION_TOKENS.PASSWORD_HASHER,
        APPLICATION_TOKENS.TOKEN_SERVICE,
        APPLICATION_TOKENS.REFRESH_SESSION_REPOSITORY,
      ],
    },
    {
      provide: RefreshTokenUseCase,
      useFactory: (
        usersRepository: PrismaUserRepository,
        tokenService: JwtTokenService,
        refreshSessionRepository: PrismaRefreshSessionRepository,
      ) => new RefreshTokenUseCase(usersRepository, tokenService, refreshSessionRepository),
      inject: [
        APPLICATION_TOKENS.USER_REPOSITORY,
        APPLICATION_TOKENS.TOKEN_SERVICE,
        APPLICATION_TOKENS.REFRESH_SESSION_REPOSITORY,
      ],
    },
    {
      provide: RevokeTokenUseCase,
      useFactory: (
        tokenService: JwtTokenService,
        refreshSessionRepository: PrismaRefreshSessionRepository,
      ) => new RevokeTokenUseCase(tokenService, refreshSessionRepository),
      inject: [APPLICATION_TOKENS.TOKEN_SERVICE, APPLICATION_TOKENS.REFRESH_SESSION_REPOSITORY],
    },
  ],
})
export class AuthModule {}
