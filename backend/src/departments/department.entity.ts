import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum TipType {
    PORCENTAJE = 'porcentaje',
    CANTIDAD_FIJA = 'cantidad_fija',
}

@Entity('departments')
export class Department {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 100 })
    name!: string;

    @Column({
        type: 'text',
        default: TipType.PORCENTAJE,
    })
    type!: TipType;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    value!: number; // Puede ser el 50 (para 50%) o 200 (para $200)

    @Column({ type: 'integer', default: 1 })
    workerCount!: number; // N° de trabajadores

    @Column({ length: 50, default: 'mesero' })
    icon!: string; // Para saber qué ícono mostrar en el frontend

    @Column({ default: true })
    isActive!: boolean;
}