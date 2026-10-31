import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
    @ApiProperty({ description: 'Nombre de usuario', example: 'gerente' })
    @IsString()
    @IsNotEmpty()
    username!: string;

    @ApiProperty({ description: 'Contraseña del usuario', example: 'miPasswordSeguro123' })
    @IsString()
    @IsNotEmpty()
    password!: string;
}