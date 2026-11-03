import { Controller, Get, Post, Body, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';
import { FilterUserDto } from './filter-user.dto'; // <-- Importar
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @ApiOperation({ summary: 'Crear un nuevo usuario' })
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    // MODIFICAMOS EL GET PRINCIPAL PARA QUE ACEPTE FILTROS
    @Get()
    @ApiOperation({ summary: 'Listar usuarios con filtros (ID, Rol, Estado)' })
    findAll(@Query() filters: FilterUserDto) {
        // Si no hay filtros, devuelve todos
        if (!filters.id && !filters.role && filters.isActive === undefined) {
            return this.usersService.findAll();
        }
        // Si hay filtros, usa el nuevo método
        return this.usersService.findWithFilters(filters);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Obtener un usuario por ID' })
    findOne(@Param('id') id: string) {
        return this.usersService.findOne(+id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar los datos de un usuario' })
    update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
        return this.usersService.update(+id, updateUserDto);
    }

    @Patch(':id/toggle-status')
    @ApiOperation({ summary: 'Activar o desactivar un usuario' })
    toggleStatus(@Param('id') id: string) {
        return this.usersService.toggleStatus(+id);
    }
}