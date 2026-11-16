import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsOptional,
    IsString,
    IsIn,
    IsInt,
    Min,
    Max,
    IsDateString,
} from 'class-validator';

export class ListConversationsDto {
    @ApiPropertyOptional({ description: 'Buscar por nombre o teléfono' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ enum: ['open', 'pending', 'closed'] })
    @IsOptional()
    @IsIn(['open', 'pending', 'closed'])
    status?: 'open' | 'pending' | 'closed';

    @ApiPropertyOptional({ description: 'Fecha inicial (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiPropertyOptional({ description: 'Fecha final (YYYY-MM-DD)' })
    @IsOptional()
    @IsDateString()
    endDate?: string;

    @ApiPropertyOptional({ default: 1, minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ default: 7, minimum: 1, maximum: 100 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 7;
}