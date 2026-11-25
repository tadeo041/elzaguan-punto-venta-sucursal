import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType, TipSource } from './tip.entity';

export class FilterTipDto {
    @ApiPropertyOptional({ description: 'ID del usuario que recibió la propina', example: 2 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    receivedById?: number;

    @ApiPropertyOptional({ description: 'Tipo de propina (1 = Efectivo, 2 = Tarjeta)', enum: PaymentType })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(PaymentType)
    paymentType?: PaymentType;

    @ApiPropertyOptional({
        description: 'Origen (1 = Mesa, 2 = Pedido)',
        enum: TipSource,
        example: TipSource.MESA,
    })
    @IsOptional()
    @Type(() => Number)
    @IsEnum(TipSource)
    source?: TipSource;

    @ApiPropertyOptional({ description: 'Fecha de inicio (YYYY-MM-DD)', example: '2026-10-01' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ description: 'Fecha de fin (YYYY-MM-DD)', example: '2026-10-31' })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({ description: 'Offset TZ del cliente en minutos', example: -360 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    tzOffsetMin?: number;

    @ApiPropertyOptional({ description: 'Número de página', example: 1, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Límite por página', example: 10, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    limit?: number = 10;
}