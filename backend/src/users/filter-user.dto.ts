import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsEnum, IsBooleanString } from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from './user.entity';

export class FilterUserDto {
    @ApiPropertyOptional({ description: 'ID del usuario', example: 2 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    id?: number;

    @ApiPropertyOptional({
        description: 'Rol del usuario',
        enum: UserRole,
        example: UserRole.CAJERO
    })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiPropertyOptional({
        description: 'Estado del usuario (true = activo, false = inactivo)',
        example: 'true'
    })
    @IsOptional()
    @IsBooleanString() // Valida que llegue como texto "true" o "false" desde la URL
    isActive?: string;
}