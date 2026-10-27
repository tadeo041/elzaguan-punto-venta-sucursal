import { Controller, Get, Post, Body, Param, Patch, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    @ApiOperation({ summary: 'Crear un nuevo usuario' })
    create(@Body() createUserDto: CreateUserDto) {
        return this.usersService.create(createUserDto);
    }

    @Get()
    @ApiOperation({ summary: 'Listar todos los usuarios' })
    findAll() {
        return this.usersService.findAll();
    }

    // OJO: Esta ruta debe ir antes de @Get(':id') para evitar conflictos
    @Get('filter')
    @ApiOperation({ summary: 'Filtrar usuarios por rol' })
    findByRole(@Query('role') role: UserRole) {
        return this.usersService.findByRole(role);
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