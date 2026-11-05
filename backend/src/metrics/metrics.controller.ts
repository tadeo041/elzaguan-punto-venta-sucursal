import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('metrics')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('metrics')
export class MetricsController {
    constructor(private readonly metricsService: MetricsService) { }

    @Get()
    @ApiOperation({ summary: 'Obtener métricas del POS' })
    @ApiQuery({ name: 'period', required: false, enum: ['day', 'week', 'month', 'year'] })
    getMetrics(@Query('period') period: string = 'month') {
        return this.metricsService.getMetrics(period);
    }
}