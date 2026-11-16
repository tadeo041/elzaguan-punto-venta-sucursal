import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleBotDto {
    @ApiProperty({ example: true, description: 'true = activar bot, false = desactivar' })
    @IsBoolean()
    activo!: boolean;
}