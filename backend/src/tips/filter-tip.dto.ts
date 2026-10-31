import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType } from './tip.entity';

export class FilterTipDto {
    @ApiPropertyOptional({ description: 'ID del mesero para filtrar', example: 2 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    waiterId?: number;

    @ApiPropertyOptional({
        description: 'Tipo de propina (1 = Efectivo, 2 = Tarjeta)',
        enum: PaymentType
    })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(PaymentType)
    paymentType?: PaymentType;

    @ApiPropertyOptional({ description: 'Fecha de inicio (YYYY-MM-DD)', example: '2026-10-01' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ description: 'Fecha de fin (YYYY-MM-DD)', example: '2026-10-31' })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({ description: 'Número de página', example: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Límite de resultados por página', example: 10, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    limit?: number = 10;
}