import { Entity, Column, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('configuraciones')
export class Configuracion {
    @PrimaryColumn({ type: 'varchar', length: 100 })
    clave!: string;

    @Column({ type: 'text' })
    valor!: string;

    @UpdateDateColumn()
    actualizadoEn!: Date;
}