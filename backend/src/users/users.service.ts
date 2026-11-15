import {
    Injectable,
    ConflictException,
    NotFoundException,
    OnApplicationBootstrap,
    Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService implements OnApplicationBootstrap {
    private readonly logger = new Logger(UsersService.name);

    constructor(
        @InjectRepository(User)
        private userRepository: Repository<User>,
    ) { }

    /**
     * Se ejecuta UNA sola vez cuando la app termina de arrancar.
     * Si el usuario semilla ya existe, se omite (idempotente).
     */
    async onApplicationBootstrap() {
        await this.seedDefaultUser();
    }

    private async seedDefaultUser() {
        // Defecto_
        const DEFAULT_USERNAME = 'gerente';
        const DEFAULT_PASSWORD = 'gerente123';
        const DEFAULT_NAME = 'Gerente Defecto';

        // 1. Verificar si ya existe - no duplicar
        const existingUser = await this.userRepository.findOne({
            where: { username: DEFAULT_USERNAME },
        });

        if (existingUser) {
            this.logger.log(
                `[Seed] El usuario "${DEFAULT_USERNAME}" ya existe. No se crea de nuevo.`,
            );
            return;
        }

        // 2. Crear el usuario con hash bcrypt (misma lógica que create())
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, salt);

        const newUser = this.userRepository.create({
            name: DEFAULT_NAME,
            username: DEFAULT_USERNAME,
            passwordHash,
            role: UserRole.GERENTE,
            isActive: true,
        });

        await this.userRepository.save(newUser);

        this.logger.warn(
            `[Seed] Usuario por defecto creado → usuario: "${DEFAULT_USERNAME}" / contraseña: "${DEFAULT_PASSWORD}"`,
        );
    }

    // 1. Crear un usuario (encriptando la contraseña)
    async create(createUserDto: any): Promise<User> {
        const { username, password, name, role } = createUserDto;

        const existingUser = await this.userRepository.findOne({ where: { username } });
        if (existingUser) {
            throw new ConflictException('El nombre de usuario ya está en uso');
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

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
            },
        });
    }

    // 3. Buscar por ID
    async findOne(id: number): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return user;
    }

    // 4. Buscar por username
    async findByUsername(username: string): Promise<User | null> {
        return await this.userRepository.findOne({ where: { username } });
    }

    // 5. Actualizar datos del usuario
    async update(id: number, updateUserDto: any): Promise<User> {
        const user = await this.findOne(id);

        if (updateUserDto.password) {
            const salt = await bcrypt.genSalt(10);
            updateUserDto.passwordHash = await bcrypt.hash(updateUserDto.password, salt);
            delete updateUserDto.password;
        }

        if (updateUserDto.username && updateUserDto.username !== user.username) {
            const existingUser = await this.userRepository.findOne({
                where: { username: updateUserDto.username },
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
        user.isActive = !user.isActive;
        return await this.userRepository.save(user);
    }

    // 7. Buscar usuarios por rol
    async findByRole(role: UserRole): Promise<User[]> {
        return await this.userRepository.find({
            where: { role },
            select: { id: true, name: true, username: true, role: true, isActive: true },
        });
    }

    // 8. Validar credenciales para el Login
    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.userRepository.findOne({
            where: { username },
            select: {
                id: true,
                name: true,
                username: true,
                role: true,
                isActive: true,
                passwordHash: true,
            },
        });

        if (!user) return null;
        if (!user.isActive) {
            throw new ConflictException('El usuario está desactivado. Contacte al gerente.');
        }

        const isMatch = await bcrypt.compare(pass, user.passwordHash);
        if (isMatch) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }

    async findWithFilters(filters: any): Promise<User[]> {
        const { id, role, isActive } = filters;

        const query = this.userRepository.createQueryBuilder('user');

        if (id) query.andWhere('user.id = :id', { id });
        if (role) query.andWhere('user.role = :role', { role });
        if (isActive !== undefined) {
            const isActiveBoolean = isActive === 'true';
            query.andWhere('user.isActive = :isActive', { isActive: isActiveBoolean });
        }

        query.select([
            'user.id',
            'user.name',
            'user.username',
            'user.role',
            'user.isActive',
        ]);

        query.orderBy('user.name', 'ASC');

        return await query.getMany();
    }
}