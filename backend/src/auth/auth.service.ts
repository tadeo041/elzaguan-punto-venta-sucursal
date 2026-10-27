import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService
    ) {}

    async login(username: string, pass: string) {
        // Usamos el método que creamos en UsersService
        const user = await this.usersService.validateUser(username, pass);
        
        if (!user) {
        throw new UnauthorizedException('Credenciales incorrectas');
        }

        // Si todo está bien, creamos el Token (payload)
        const payload = { username: user.username, sub: user.id, role: user.role };
        
        return {
        message: 'Login exitoso',
        user: user, // Devolvemos los datos del usuario (sin contraseña)
        access_token: this.jwtService.sign(payload), // El token JWT
        };
    }
}