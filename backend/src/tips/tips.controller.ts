import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TipsService } from './tips.service';
import { CreateTipDto } from './create-tip.dto';
import { FilterTipDto } from './filter-tip.dto';
import { ApiTags, ApiOperation, ApiBearerAuth  } from '@nestjs/swagger';

@ApiTags('tips')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt')) 
@Controller('tips')
export class TipsController {
    constructor(private readonly tipsService: TipsService) { }

    @Post()
    @ApiOperation({ summary: 'Registrar una nueva propina' })
    create(@Body() createTipDto: CreateTipDto) {
        return this.tipsService.create(createTipDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar propinas con filtros, paginación y totales' })
    findAll(@Query() filters: FilterTipDto) {
        // @Query() toma los parámetros de la URL (ej: ?waiterId=1&page=2)
        return this.tipsService.findAllWithFilters(filters);
    }

    @Get('resumen')
    @ApiOperation({ summary: 'Obtener totales generales (sin filtros)' })
    getResumen() {
        return this.tipsService.getResumen();
    }
}