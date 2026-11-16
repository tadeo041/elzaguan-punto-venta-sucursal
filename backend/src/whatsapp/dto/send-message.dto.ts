import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SendMessageDto {
    @ApiProperty({ example: '¡Hola! Tu reserva está confirmada.' })
    @IsString()
    @IsNotEmpty()
    @MaxLength(4096)
    texto!: string;
}