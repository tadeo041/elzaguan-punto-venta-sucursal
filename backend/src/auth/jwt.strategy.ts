import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: 'EL_ZAGUAN_SECRET_KEY_2026', // En producción, esto debe ir en un .env
        });
    }

    async validate(payload: any) {
        // Esto es lo que se inyectará en req.user cuando la ruta esté protegida
        return { userId: payload.sub, username: payload.username, role: payload.role };
    }
}