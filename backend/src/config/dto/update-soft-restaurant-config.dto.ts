import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateSoftRestaurantConfigDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    server?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    port?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    database?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    user?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    password?: string;
}