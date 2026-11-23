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
        example: UserRole.MESERO, // <-- antes CAJERO
    })
    @IsOptional()
    @IsEnum(UserRole)
    role?: UserRole;

    @ApiPropertyOptional({
        description: 'Estado del usuario (true = activo, false = inactivo)',
        example: 'true',
    })
    @IsOptional()
    @IsBooleanString()
    isActive?: string;
}