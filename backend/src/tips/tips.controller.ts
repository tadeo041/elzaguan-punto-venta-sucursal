import { Controller, Get, Post, Body, Query, Param, UseGuards, Req, Patch } from '@nestjs/common';
import { TipsService } from './tips.service';
import { CreateTipDto } from './create-tip.dto';
import { FilterTipDto } from './filter-tip.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('tips')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('tips')
export class TipsController {
    constructor(private readonly tipsService: TipsService) { }

    @Post()
    @ApiOperation({ summary: 'Registrar una nueva propina' })
    create(@Body() createTipDto: CreateTipDto, @Req() req: any) {
        // Extraemos el ID del usuario logueado desde el token JWT
        const userId = req.user.userId; 
        return this.tipsService.create(createTipDto, userId);
    }

    @Get()
    @ApiOperation({ summary: 'Listar propinas con filtros, paginación y totales' })
    findAll(@Query() filters: FilterTipDto) {
        return this.tipsService.findAllWithFilters(filters);
    }

    @Get('resumen')
    @ApiOperation({ summary: 'Obtener totales generales (sin filtros)' })
    getResumen() {
        return this.tipsService.getResumen();
    }

    @Get(':id/details')
    @ApiOperation({ summary: 'Obtener detalle de propina e historial de cambios' })
    getDetails(@Param('id') id: string) {
        return this.tipsService.getTipDetails(+id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar una propina existente' })
    update(@Param('id') id: string, @Body() updateTipDto: any, @Req() req: any) {
        return this.tipsService.update(+id, updateTipDto, req.user.userId);
    }    
}