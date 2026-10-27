import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum UserRole {
    GERENTE = 'gerente',
    CAJERO = 'cajero',
    MESERO = 'mesero',
    COCINERO = 'cocinero',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 100 })
    name!: string;

    @Column({ length: 50, unique: true })
    username!: string;

    @Column()
    passwordHash!: string;

    @Column({
        type: 'text',
        default: UserRole.CAJERO, // Por defecto será cajero
    })
    role!: UserRole;

    @Column({ default: true })
    isActive!: boolean;
}