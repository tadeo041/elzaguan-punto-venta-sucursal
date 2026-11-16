import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { Message } from './message.entity';

export enum ConversationStatus {
    OPEN = 'open',
    PENDING = 'pending',
    CLOSED = 'closed',
}

export enum LastMessageOrigin {
    CLIENTE = 'cliente',
    HUMANO = 'humano',
    BOT = 'bot',
}

@Entity('conversations')
@Index(['lastMessageAt'])
@Index(['status'])
export class Conversation {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true, length: 20 })
    phoneNumber!: string;

    @Column({ length: 100, nullable: true })
    name!: string;

    @Column({ default: true })
    botActivo!: boolean;

    @Column({ type: 'text', default: ConversationStatus.OPEN })
    status!: ConversationStatus;

    @Column({ type: 'text', nullable: true })
    lastMessagePreview!: string;

    @Column({ type: 'text', nullable: true })
    lastMessageOrigin!: LastMessageOrigin;

    @Column({ type: 'datetime', nullable: true })
    lastMessageAt!: Date;

    @Column({ type: 'datetime', nullable: true })
    lastClientMessageAt!: Date;

    @Column({ type: 'datetime', nullable: true })
    lastOutgoingMessageAt!: Date;

    @Column({ type: 'integer', default: 0 })
    unreadCount!: number;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @OneToMany(() => Message, (m) => m.conversation)
    messages!: Message[];
}