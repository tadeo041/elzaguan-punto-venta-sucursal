import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) {}

    // 1. Crear un usuario (encriptando la contraseña)
    async create(createUserDto: any): Promise<User> {
        const { username, password, name, role } = createUserDto;

        // Verificar si el usuario ya existe
        const existingUser = await this.userRepository.findOne({ where: { username } });
        if (existingUser) {
        throw new ConflictException('El nombre de usuario ya está en uso');
        }

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Crear el registro
        const newUser = this.userRepository.create({
        name,
        username,
        passwordHash,
        role: role || UserRole.CAJERO,
        });

        return await this.userRepository.save(newUser);
    }

    // 2. Listar todos los usuarios
    async findAll(): Promise<User[]> {
        return await this.userRepository.find({
            select: { 
                id: true,
                name: true,
                username: true,
                role: true,
                isActive: true,
            } // Ocultamos el hash de la contraseña
        });
    }

    // 3. Buscar por ID
    async findOne(id: number): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return user;
    }

    // 4. Buscar por username (lo usaremos para el Login más adelante)
    async findByUsername(username: string): Promise<User | null> {
        return await this.userRepository.findOne({ where: { username } });
    }

    // 5. Actualizar datos del usuario (nombre, username, password, rol)
    async update(id: number, updateUserDto: any): Promise<User> {
        const user = await this.findOne(id);

        // Si el usuario está enviando una nueva contraseña, la encriptamos
        if (updateUserDto.password) {
        const salt = await bcrypt.genSalt(10);
        updateUserDto.passwordHash = await bcrypt.hash(updateUserDto.password, salt);
        delete updateUserDto.password; // Eliminamos la contraseña en texto plano
        }

        // Verificar si el nuevo username ya está ocupado por otro usuario
        if (updateUserDto.username && updateUserDto.username !== user.username) {
        const existingUser = await this.userRepository.findOne({ 
            where: { username: updateUserDto.username } 
        });
        if (existingUser) {
            throw new ConflictException('El nombre de usuario ya está en uso');
        }
        }

        const updatedUser = Object.assign(user, updateUserDto);
        return await this.userRepository.save(updatedUser);
    }

    // 6. Cambiar estado (Activar / Desactivar)
    async toggleStatus(id: number): Promise<User> {
        const user = await this.findOne(id);
        user.isActive = !user.isActive; // Invierte el valor (true pasa a false, y viceversa)
        return await this.userRepository.save(user);
    }

    // 7. Buscar usuarios por rol (gerente, cajero, mesero, cocinero)
    async findByRole(role: UserRole): Promise<User[]> {
        return await this.userRepository.find({
        where: { role },
        select: { id: true, name: true, username: true, role: true, isActive: true }
        });
    }
    
    // 8. Validar credenciales para el Login
    async validateUser(username: string, pass: string): Promise<any> {
        // Buscamos al usuario incluyendo el hash de la contraseña
        const user = await this.userRepository.findOne({ 
        where: { username },
        select: { id: true, name: true, username: true, role: true, isActive: true, passwordHash: true } 
        });

        if (!user) return null;
        if (!user.isActive) {
        throw new ConflictException('El usuario está desactivado. Contacte al gerente.');
        }

        // Comparamos la contraseña enviada con el hash guardado en la BD
        const isMatch = await bcrypt.compare(pass, user.passwordHash);
        if (isMatch) {
        // Si es correcta, quitamos el hash por seguridad antes de devolver el usuario
        const { passwordHash, ...result } = user;
        return result;
        }
        return null;
    }    
}