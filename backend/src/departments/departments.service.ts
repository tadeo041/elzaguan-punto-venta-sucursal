import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department, DepartmentSlug } from './department.entity';

@Injectable()
export class DepartmentsService implements OnApplicationBootstrap {
    private readonly logger = new Logger(DepartmentsService.name);

    constructor(
        @InjectRepository(Department)
        private departmentRepository: Repository<Department>,
    ) { }

    async onApplicationBootstrap() {
        await this.seedDefaults();
    }

    /**
     * Crea los 3 departamentos fijos si no existen. Idempotente.
     * El usuario no puede crear/editar/eliminar departamentos.
     */
    private async seedDefaults() {
        const defaults = [
            { slug: DepartmentSlug.GERENTE, name: 'Gerente',  icon: 'gerente', sortOrder: 1 },
            { slug: DepartmentSlug.MESEROS, name: 'Meseros',  icon: 'mesero',  sortOrder: 2 },
            { slug: DepartmentSlug.COCINA,  name: 'Cocina',   icon: 'cocina',  sortOrder: 3 },
        ];

        for (const def of defaults) {
            const existing = await this.departmentRepository.findOne({ where: { slug: def.slug } });
            if (existing) continue;

            await this.departmentRepository.save(this.departmentRepository.create(def));
            this.logger.log(`[Seed] Departamento creado: ${def.name}`);
        }
    }

    async findAll() {
        return await this.departmentRepository.find({
            order: { sortOrder: 'ASC' },
        });
    }
}