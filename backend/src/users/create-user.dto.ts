import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from './user.entity';
import { IsString, IsNotEmpty, IsEnum, MinLength } from 'class-validator';

export class CreateUserDto {
    @ApiProperty({ description: 'Nombre completo del usuario', example: 'Tadeo Gerente' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ description: 'Nombre de usuario único para iniciar sesión', example: 'gerente' })
    @IsString()
    @IsNotEmpty()
    username!: string;

    @ApiProperty({ description: 'Contraseña del usuario', example: 'miPasswordSeguro123' })
    @IsString()
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    password!: string;

    @ApiProperty({ 
        description: 'Rol del usuario en el sistema', 
        enum: UserRole, 
        default: UserRole.CAJERO,
        example: UserRole.GERENTE
    })
    @IsEnum(UserRole)
    role!: UserRole;
}