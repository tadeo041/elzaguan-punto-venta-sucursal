import { ApiProperty } from '@nestjs/swagger';
import { PaymentType } from './tip.entity';
import { IsNumber, IsEnum, IsPositive } from 'class-validator';

export class CreateTipDto {
    @ApiProperty({ description: 'Número de la mesa', example: 1 })
    @IsNumber()
    @IsPositive()
    tableNumber!: number;

    @ApiProperty({ description: 'Monto de la propina', example: 50.00 })
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