import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

// Slugs fijos del sistema. El usuario NO crea departamentos.
export enum DepartmentSlug {
    GERENTE = 'gerente',
    MESEROS = 'meseros',
    COCINA = 'cocina',
}

@Entity('departments')
export class Department {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 50, unique: true })
    slug!: DepartmentSlug;

    @Column({ length: 100 })
    name!: string;

    @Column({ length: 50, default: 'mesero' })
    icon!: string;

    @Column({ type: 'integer', default: 0 })
    sortOrder!: number; // para ordenar en el frontend: Gerente, Meseros, Cocina
}