import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SoftRestaurantService } from './soft-restaurant.service';

@ApiTags('soft-restaurant')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('soft-restaurant')
export class SoftRestaurantController {
    constructor(private readonly sr: SoftRestaurantService) { }

    @Get('status')
    @ApiOperation({ summary: 'Estado de conexión a Soft Restaurant' })
    status() {
        return this.sr.verificarConexion();
    }

    @Get('panel-general')
    @ApiOperation({ summary: 'Datos completos del panel general' })
    @ApiQuery({ name: 'fecha', required: false, description: 'YYYY-MM-DD, por defecto hoy' })
    panelGeneral(@Query('fecha') fecha?: string) {
        return this.sr.obtenerPanelGeneral(fecha);
    }

    @Get('turno-actual')
    @ApiOperation({ summary: 'Turno abierto actual' })
    turnoActual() {
        return this.sr.obtenerTurnoActual();
    }


    @Get('ventas-dia')
    @ApiOperation({ summary: 'Total de ventas del día (para meta de propinas)' })
    @ApiQuery({ name: 'fecha', required: false, description: 'YYYY-MM-DD, por defecto hoy' })
    ventasDia(@Query('fecha') fecha?: string) {
        return this.sr.obtenerTotalVentasDia(fecha);
    }
}