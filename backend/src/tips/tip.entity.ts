import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from '../users/user.entity';

// Efinimos el Enum para que el código sea más legible

export enum PaymentType{
    EFECTIVO = 1,
    TARJETA = 2,
}


// Definimos el nombre de la entidad 
@Entity('tips')
export class Tip{
    
    // Crear una columna "id" que se autoincrementa (1,2,3 y 4 ...)
    @PrimaryGeneratedColumn()
    id!: number;

    // Crea una columna de números enteros para la mesas
    @Column({ type: 'integer'})
    tableNumber!: number;

    // Crea una columna para el dínero
    @Column({ type: 'decimal' , precision: 10, scale: 2})
    amount!: number;

    // Crea columna tipo de proina con número 
    @Column({
        type: 'integer',
        default: PaymentType.EFECTIVO
    })
    paymentType!: PaymentType;

    // RELACIÓN: Muchas propinas pueden ser de UN solo mesero (User)
    @ManyToOne(() => User) 
    @JoinColumn({ name: 'waiter_id' }) // Crea una columna oculta llamada 'waiter_id' en la tabla
    waiter!: User;

    @CreateDateColumn() // TypeORM llena esto automáticamente con la fecha y hora exacta de creación
    createdAt!: Date;
}

