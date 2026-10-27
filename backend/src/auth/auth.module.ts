import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module'; 
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule, 
    PassportModule,
    JwtModule.register({
      secret: 'EL_ZAGUAN_SECRET_KEY_2026', // Debe ser el mismo del jwt.strategy.ts
      signOptions: { expiresIn: '1d' }, // El token dura 1 día (ideal para un turno)
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}