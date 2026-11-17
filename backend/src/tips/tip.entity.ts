import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

export enum PaymentType {
    EFECTIVO = 1,
    TARJETA = 2,
}

@Entity('tips')
export class Tip {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ type: 'integer' })
    tableNumber!: number;

    @Column({ type: 'decimal', precision: 10, scale: 2 })
    amount!: number;

    @Column({
        type: 'integer',
        default: PaymentType.EFECTIVO,
    })
    paymentType!: PaymentType;

    // Quién recibió la propina (mesero o gerente). Solo informativo/auditoría.
    @ManyToOne(() => User)
    @JoinColumn({ name: 'received_by_id' })
    receivedBy!: User;

    @CreateDateColumn()
    createdAt!: Date;
}