import { Controller, Get, Post, Body, Param, Query, Patch, UseGuards } from '@nestjs/common';
import { DailyService } from './daily.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CreateDailyConfigDto } from './create-daily-config.dto';

@ApiTags('daily')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('daily')
export class DailyController {
    constructor(private readonly dailyService: DailyService) { }

    @Get(':date')
    @ApiOperation({ summary: 'Obtener (o crear) la configuración de un día' })
    get(@Param('date') date: string) {
        return this.dailyService.getOrCreate(date);
    }

    @Patch(':date')
    @ApiOperation({ summary: 'Actualizar cantidades y retardos de un día (si no está confirmado)' })
    update(@Param('date') date: string, @Body() dto: CreateDailyConfigDto) {
        return this.dailyService.update(date, dto);
    }

    @Get(':date/preview')
    @ApiOperation({ summary: 'Vista previa del reparto del día (no guarda)' })
    @ApiQuery({ name: 'tzOffsetMin', required: false, example: -360 })
    preview(@Param('date') date: string, @Query('tzOffsetMin') tz?: string) {
        const offset = tz != null && !isNaN(Number(tz)) ? Number(tz) : -360;
        return this.dailyService.preview(date, offset);
    }

    @Post(':date/confirm')
    @ApiOperation({ summary: 'Confirmar el día y guardar snapshot histórico (sin body)' })
    @ApiQuery({ name: 'tzOffsetMin', required: false, example: -360 })
    confirm(@Param('date') date: string, @Query('tzOffsetMin') tz?: string) {
        const offset = tz != null && !isNaN(Number(tz)) ? Number(tz) : -360;
        return this.dailyService.confirm(date, offset);
    }

    @Get()
    @ApiOperation({ summary: 'Historial de días confirmados' })
    @ApiQuery({ name: 'from', required: false, example: '2026-11-01' })
    @ApiQuery({ name: 'to', required: false, example: '2026-11-30' })
    history(@Query('from') from?: string, @Query('to') to?: string) {
        return this.dailyService.history(from, to);
    }
}