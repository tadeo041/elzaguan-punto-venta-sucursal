import { Controller, Get, UseGuards } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('departments')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('departments')
export class DepartmentsController {
    constructor(private readonly departmentsService: DepartmentsService) { }

    @Get()
    @ApiOperation({ summary: 'Listar los departamentos fijos del sistema (Gerente, Meseros, Cocina)' })
    findAll() {
        return this.departmentsService.findAll();
    }
}