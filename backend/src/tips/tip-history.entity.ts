import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Tip } from './tip.entity';
import { User } from '../users/user.entity';

export enum ActionType {
    CREACION = 'creacion',
    CAMBIO_MESERO = 'cambio_mesero',
    CAMBIO_MONTO = 'cambio_monto',
    CAMBIO_MESA = 'cambio_mesa',
    CAMBIO_ENTREGA = 'cambio_entrega',
}

@Entity('tip_history')
export class TipHistory {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Tip, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'tip_id' })
    tip!: Tip;

    @Column({
        type: 'text',
    })
    action!: ActionType;

    // Guardamos los valores anteriores y nuevos como JSON (para no crear 10 columnas)
    @Column({ type: 'simple-json', nullable: true })
    previousData!: any;

    @Column({ type: 'simple-json', nullable: true })
    newData!: any;

    // Quién hizo el cambio
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    modifiedBy!: User;

    @CreateDateColumn()
    createdAt!: Date;
}