import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LoginDto } from '../users/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('login')
    @ApiOperation({ summary: 'Iniciar sesión y obtener token JWT' })
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.username, loginDto.password);
    }
}