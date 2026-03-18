import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './controllers/auth.controller';
import { RefreshSessionsRepository } from './repositories/refresh-sessions.repository';
import { AuthService } from './services/auth.service';

@Module({
  imports: [ConfigModule, JwtModule.register({}), UsersModule],
  controllers: [AuthController],
  providers: [AuthService, RefreshSessionsRepository],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
