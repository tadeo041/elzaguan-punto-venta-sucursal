import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from './user.entity';

export class CreateUserDto {
    @ApiProperty({ description: 'Nombre completo del usuario', example: 'Tadeo Gerente' })
    name!: string;

    @ApiProperty({ description: 'Nombre de usuario único para iniciar sesión', example: 'gerente' })
    username!: string;

    @ApiProperty({ description: 'Contraseña del usuario', example: 'miPasswordSeguro123' })
    password!: string;

    @ApiProperty({ 
        description: 'Rol del usuario en el sistema', 
        enum: UserRole, 
        default: UserRole.CAJERO,
        example: UserRole.GERENTE
    })
    role!: UserRole;
}