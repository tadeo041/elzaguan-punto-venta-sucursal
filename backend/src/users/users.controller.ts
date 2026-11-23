import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Patch,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UserRole } from './user.entity';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';
import { FilterUserDto } from './filter-user.dto';
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

    @Get()
    @ApiOperation({
        summary:
            'Listar usuarios con filtros (ID, Rol, Estado). ' +
            'Admin ve todos; el resto no ve administradores.',
    })
    findAll(@Query() filters: FilterUserDto, @Req() req: any) {
        // req.user viene del JwtStrategy.validate()
        const requestingRole: UserRole = req.user.role;

        const hasFilters =
            filters.id !== undefined ||
            filters.role !== undefined ||
            filters.isActive !== undefined;

        if (!hasFilters) {
            return this.usersService.findAll(requestingRole);
        }
        return this.usersService.findWithFilters(filters, requestingRole);
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