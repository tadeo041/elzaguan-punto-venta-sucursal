import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentType, TipSource } from './tip.entity';
import {
    IsNumber,
    IsEnum,
    IsPositive,
    IsOptional,
    ValidateIf,
} from 'class-validator';

export class CreateTipDto {
    @ApiProperty({
        description: 'Origen de la propina (1 = Mesa, 2 = Pedido)',
        enum: TipSource,
        example: TipSource.MESA,
        default: TipSource.MESA,
    })
    @IsEnum(TipSource)
    source!: TipSource;

    @ApiPropertyOptional({
        description: 'Número de la mesa (obligatorio si source = 1)',
        example: 1,
    })
    @ValidateIf((o) => o.source === TipSource.MESA)
    @IsNumber()
    @IsPositive()
    tableNumber?: number;

    @ApiProperty({ description: 'Monto de la propina', example: 50.0 })
    @IsNumber()
    @IsPositive()
    amount!: number;

    @ApiProperty({
        description: 'Método de pago (1 = Efectivo, 2 = Tarjeta)',
        example: PaymentType.EFECTIVO,
        enum: PaymentType,
    })
    @IsEnum(PaymentType)
    paymentType!: PaymentType;

    @ApiProperty({
        description: 'ID del usuario que recibió la propina (mesero o gerente)',
        example: 2,
    })
    @IsNumber()
    @IsPositive()
    receivedById!: number;
}

export class UpdateTipDto {
    @ApiPropertyOptional({ enum: TipSource })
    @IsOptional()
    @IsEnum(TipSource)
    source?: TipSource;

    @ApiPropertyOptional({ example: 1 })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    tableNumber?: number;

    @ApiPropertyOptional({ example: 50.0 })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    amount?: number;

    @ApiPropertyOptional({ enum: PaymentType })
    @IsOptional()
    @IsEnum(PaymentType)
    paymentType?: PaymentType;

    @ApiPropertyOptional({ example: 2 })
    @IsOptional()
    @IsNumber()
    @IsPositive()
    receivedById?: number;
}