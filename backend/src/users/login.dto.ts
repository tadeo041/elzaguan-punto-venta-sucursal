import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
    @ApiProperty({ description: 'Nombre de usuario', example: 'gerente' })
    username!: string;

    @ApiProperty({ description: 'Contraseña del usuario', example: 'miPasswordSeguro123' })
    password!: string;
}