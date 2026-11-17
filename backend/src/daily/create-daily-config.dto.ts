import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDailyConfigDto {
    @ApiProperty({ description: 'Fecha del día (YYYY-MM-DD)', example: '2026-11-16' })
    @IsDateString()
    date!: string;

    @ApiPropertyOptional({ example: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    gerenteCount?: number;

    @ApiPropertyOptional({ example: 2, default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    meseroCount?: number;

    @ApiPropertyOptional({ example: 3, default: 0 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    cocinaCount?: number;

    @ApiPropertyOptional({ example: 0, default: 0, description: 'Personas de gerencia que llegaron tarde' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    gerenteRetardos?: number;

    @ApiPropertyOptional({ example: 1, default: 0, description: 'Meseros que llegaron tarde' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    meseroRetardos?: number;

    @ApiPropertyOptional({ example: 2, default: 0, description: 'Cocineros que llegaron tarde' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    cocinaRetardos?: number;
}

export class UpdateDailyConfigDto extends CreateDailyConfigDto {}

// Ya no se envían departamentos: los departamentos son fijos (Gerente, Meseros, Cocina)
// y la regla estructural Cocina→Meseros (20%) también es fija.
export class ConfirmDailyDto {}