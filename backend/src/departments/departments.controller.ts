import { Controller, Get, Post, Body, Query, UseGuards, Patch, Param } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './create-department.dto';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('departments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('departments')
export class DepartmentsController {
    constructor(private readonly departmentsService: DepartmentsService) { }

    @Post()
    @ApiOperation({ summary: 'Crear un nuevo departamento' })
    create(@Body() createDto: CreateDepartmentDto) {
        return this.departmentsService.create(createDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar departamentos configurados' })
    findAll() {
        return this.departmentsService.findAll();
    }

    @Get('distribution')
    @ApiOperation({ summary: 'Calcular distribución de propinas desde una fecha' })
    @ApiQuery({ name: 'startDate', required: true, example: '2026-11-01' })
    getDistribution(@Query('startDate') startDate: string) {
        if (!startDate) {
            // Si no mandan fecha, por defecto usamos el primer día del mes actual
            const hoy = new Date();
            const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
            startDate = primerDia.toISOString().split('T')[0];
        }
        return this.departmentsService.getDistribution(startDate);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar un departamento existente' })
    update(@Param('id') id: string, @Body() updateDto: any) {
        return this.departmentsService.update(+id, updateDto);
    }
}