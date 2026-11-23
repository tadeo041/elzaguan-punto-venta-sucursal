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

    async onApplicationBootstrap() {
        await this.seedDefaultUser();
    }

    private async seedDefaultUser() {
        const DEFAULT_USERNAME = 'administrador';
        const DEFAULT_PASSWORD = 'administrador206920';
        const DEFAULT_NAME = 'Administrador Defecto';

        const existingUser = await this.userRepository.findOne({
            where: { username: DEFAULT_USERNAME },
        });

        if (existingUser) {
            this.logger.log(
                `[Seed] El usuario "${DEFAULT_USERNAME}" ya existe. No se crea de nuevo.`,
            );
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, salt);

        const newUser = this.userRepository.create({
            name: DEFAULT_NAME,
            username: DEFAULT_USERNAME,
            passwordHash,
            role: UserRole.ADMINISTRADOR,
            isActive: true,
        });

        await this.userRepository.save(newUser);

        this.logger.warn(
            `[Seed] Usuario por defecto creado → usuario: "${DEFAULT_USERNAME}" / contraseña: "${DEFAULT_PASSWORD}"`,
        );
    }

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
            role: role || UserRole.MESERO, 
        });

        return await this.userRepository.save(newUser);
    }

    async findAll(requestingRole: UserRole): Promise<User[]> {
        const query = this.userRepository.createQueryBuilder('user');

        this.applyRoleVisibility(query, requestingRole);

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

    async findWithFilters(filters: any, requestingRole: UserRole): Promise<User[]> {
        const { id, role, isActive } = filters;

        const query = this.userRepository.createQueryBuilder('user');

        if (id) query.andWhere('user.id = :id', { id });
        if (role) query.andWhere('user.role = :role', { role });
        if (isActive !== undefined) {
            const isActiveBoolean = isActive === 'true';
            query.andWhere('user.isActive = :isActive', { isActive: isActiveBoolean });
        }

        this.applyRoleVisibility(query, requestingRole);

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

    private applyRoleVisibility(query: any, requestingRole: UserRole) {
        if (requestingRole === UserRole.ADMINISTRADOR) {
            return;
        }
        query.andWhere('user.role != :hiddenRole', {
            hiddenRole: UserRole.ADMINISTRADOR,
        });
    }

    async findOne(id: number): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return user;
    }

    async findByUsername(username: string): Promise<User | null> {
        return await this.userRepository.findOne({ where: { username } });
    }

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

    async toggleStatus(id: number): Promise<User> {
        const user = await this.findOne(id);
        user.isActive = !user.isActive;
        return await this.userRepository.save(user);
    }

    async findByRole(role: UserRole): Promise<User[]> {
        return await this.userRepository.find({
            where: { role },
            select: { id: true, name: true, username: true, role: true, isActive: true },
        });
    }

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
            throw new ConflictException('El usuario está desactivado. Contacte al administrador.');
        }

        const isMatch = await bcrypt.compare(pass, user.passwordHash);
        if (isMatch) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }
}