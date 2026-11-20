import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('daily_configs')
export class DailyConfig {
    @PrimaryGeneratedColumn()
    id!: number;

    // Día al que corresponde la configuración (único por día)
    @Column({ type: 'date', unique: true })
    date!: string; // 'YYYY-MM-DD'

    // Cantidades de personas por área ese día
    @Column({ type: 'integer', default: 1 })
    gerenteCount!: number;

    @Column({ type: 'integer', default: 2 })
    meseroCount!: number;

    @Column({ type: 'integer', default: 2 })
    cocinaCount!: number;

    // Retardos por área ese día
    @Column({ type: 'integer', default: 0 })
    gerenteRetardos!: number;

    @Column({ type: 'integer', default: 0 })
    meseroRetardos!: number;

    @Column({ type: 'integer', default: 0 })
    cocinaRetardos!: number;

    // Total de propinas del día (se calcula al confirmar el reparto)
    @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
    totalTips!: number;

    // Snapshot del reparto (JSON). null = aún no confirmado
    // Estructura: { areas: [{ name, departmentTotal, individualAmount, normalAmount, lateAmount, normalCount, lateCount }], totalTips }
    @Column({ type: 'simple-json', nullable: true })
    snapshot!: any | null;

    @Column({ default: false })
    confirmed!: boolean;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}