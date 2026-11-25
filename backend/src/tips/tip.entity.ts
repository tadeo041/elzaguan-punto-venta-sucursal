import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum PaymentType {
    EFECTIVO = 1,
    TARJETA  = 2,
}

export enum TipSource {
    MESA   = 1,
    PEDIDO = 2,
}

@Entity('tips')
export class Tip {
    @PrimaryGeneratedColumn()
    id!: number;

    // Solo obligatorio cuando source = MESA (1)
    @Column({ type: 'integer', nullable: true })
    tableNumber!: number | null;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount!: number;

    @Column({ type: 'integer', default: PaymentType.EFECTIVO })
    paymentType!: PaymentType;

    // Origen: 1 = Mesa, 2 = Pedido
    @Column({ type: 'smallint', default: TipSource.MESA })
    source!: TipSource;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'received_by_id' })
    receivedBy!: User;

    @CreateDateColumn()
    createdAt!: Date;
}