import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';

export enum MessageDirection {
    IN = 'in',
    OUT = 'out',
}

export enum MessageOrigin {
    CLIENTE = 'cliente',
    HUMANO = 'humano',
    BOT = 'bot',
}

export enum MessageStatus {
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read',
    FAILED = 'failed',
}

export enum MessageType {
    TEXT = 'text',
    TEMPLATE = 'template',
}

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Conversation, (c) => c.messages, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'conversation_id' })
    conversation!: Conversation;

    @Column({ type: 'text' })
    direction!: MessageDirection;

    @Column({ type: 'text' })
    origin!: MessageOrigin;

    @Column({ type: 'text' })
    messageType!: MessageType;

    @Column({ type: 'text' })
    content!: string;

    @Column({ type: 'text', nullable: true })
    whatsappMessageId!: string;

    @Column({ type: 'text', default: MessageStatus.SENT })
    status!: MessageStatus;

    @Column({ type: 'text', nullable: true })
    templateName!: string;

    @Column({ type: 'simple-json', nullable: true })
    metadata!: any;

    @CreateDateColumn()
    createdAt!: Date;
}