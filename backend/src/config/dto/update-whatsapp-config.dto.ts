import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateWhatsappConfigDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    phoneNumberId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    accessToken?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    verifyToken?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    apiVersion?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    wabaId?: string;
}