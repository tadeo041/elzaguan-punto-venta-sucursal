import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsNotEmpty, Min } from 'class-validator';
import { TipType } from './department.entity';

export class CreateDepartmentDto {
    @ApiProperty({ description: 'Nombre del departamento', example: 'Cocina' })
    @IsString()
    @IsNotEmpty()
    name!: string;

    @ApiProperty({ description: 'Tipo de reparto', enum: TipType, example: TipType.PORCENTAJE })
    @IsEnum(TipType)
    type!: TipType;

    @ApiProperty({ description: 'Valor (Porcentaje o Monto)', example: 30 })
    @IsNumber()
    @Min(0)
    value!: number;

    @ApiProperty({ description: 'Número de trabajadores', example: 3 })
    @IsNumber()
    @Min(1)
    workerCount!: number;

    @ApiProperty({ description: 'Ícono representativo', example: 'cocina' })
    @IsString()
    icon!: string;
}