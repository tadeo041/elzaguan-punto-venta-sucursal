import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';

import {
    Conversation,
    ConversationStatus,
    LastMessageOrigin,
} from './entities/conversation.entity';
import {
    Message,
    MessageDirection,
    MessageOrigin,
    MessageStatus,
    MessageType,
} from './entities/message.entity';
import { BotService } from './bot.service';
import { ListConversationsDto } from './dto/list-conversations.dto';
import { ConfiguracionService } from '../config/configuracion.service';

const VENTANA_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);

    constructor(
        @InjectRepository(Conversation)
        private conversationRepo: Repository<Conversation>,
        @InjectRepository(Message)
        private messageRepo: Repository<Message>,
        private botService: BotService,
        private configuracionService: ConfiguracionService,
    ) {}

    // ================= WEBHOOK =================

    verificarWebhook(mode: string, token: string, challenge: string): string {
        const verifyToken = this.configuracionService.obtener('WHATSAPP_VERIFY_TOKEN');
        if (mode === 'subscribe' && token === verifyToken) {
            this.logger.log('✅ Webhook verificado por Meta');
            return challenge;
        }
        this.logger.warn('❌ Verificación de webhook fallida');
        throw new NotFoundException('Verificación fallida');
    }

    async procesarWebhook(body: any): Promise<void> {
        try {
            const value = body?.entry?.[0]?.changes?.[0]?.value;
            if (!value) return;

            if (value.messages?.length) {
                const contact = value.contacts?.[0];
                for (const msg of value.messages) {
                    await this.procesarMensajeEntrante(msg, contact);
                }
            }

            if (value.statuses?.length) {
                for (const status of value.statuses) {
                    await this.actualizarEstadoMensaje(status);
                }
            }
        } catch (error) {
            this.logger.error('Error procesando webhook', error);
        }
    }

    // ================= MENSAJE ENTRANTE =================

    private normalizarTelefonoMx(telefono: string): string {
        if (!telefono) return telefono;
        if (telefono.startsWith('521') && telefono.length === 13) {
            return '52' + telefono.substring(3);
        }
        return telefono;
    }

    private async procesarMensajeEntrante(msg: any, contact: any): Promise<void> {
        if (msg.type !== 'text') {
            this.logger.warn(`Mensaje tipo "${msg.type}" ignorado (solo texto por ahora)`);
            return;
        }

        const telefono: string = this.normalizarTelefonoMx(msg.from);
        const texto: string = msg.text?.body ?? '';
        const whatsappMessageId: string = msg.id;
        const nombrePerfil: string = contact?.profile?.name ?? 'Cliente';

        const duplicado = await this.messageRepo.findOne({
            where: { whatsappMessageId },
        });
        if (duplicado) return;

        let conversation = await this.conversationRepo.findOne({
            where: { phoneNumber: telefono },
        });

        if (!conversation) {
            conversation = this.conversationRepo.create({
                phoneNumber: telefono,
                name: nombrePerfil,
                botActivo: true,
                status: ConversationStatus.OPEN,
            });
            conversation = await this.conversationRepo.save(conversation);
            this.logger.log(`📥 Nueva conversación con ${nombrePerfil} (${telefono})`);
        }

        const ahora = new Date();
        await this.messageRepo.save(
            this.messageRepo.create({
                conversation,
                direction: MessageDirection.IN,
                origin: MessageOrigin.CLIENTE,
                messageType: MessageType.TEXT,
                content: texto,
                whatsappMessageId,
                status: MessageStatus.DELIVERED,
            }),
        );

        conversation.lastMessagePreview = texto;
        conversation.lastMessageOrigin = LastMessageOrigin.CLIENTE;
        conversation.lastMessageAt = ahora;
        conversation.lastClientMessageAt = ahora;
        conversation.unreadCount += 1;
        conversation.status = ConversationStatus.OPEN;
        await this.conversationRepo.save(conversation);

        if (conversation.botActivo) {
            const { response } = this.botService.generarRespuesta(texto, conversation.name);
            await this.enviarTexto(conversation, response, MessageOrigin.BOT);
        }
    }

    // ================= ENVIAR A META =================

    async enviarTexto(
        conversation: Conversation,
        texto: string,
        origen: MessageOrigin = MessageOrigin.HUMANO,
    ): Promise<Message> {
        const phoneNumberId = this.configuracionService.obtener('WHATSAPP_PHONE_NUMBER_ID');
        const accessToken = this.configuracionService.obtener('WHATSAPP_ACCESS_TOKEN');
        const apiVersion = this.configuracionService.obtener('WHATSAPP_API_VERSION') ?? 'v25.0';
        const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

        const mensaje = this.messageRepo.create({
            conversation,
            direction: MessageDirection.OUT,
            origin: origen,
            messageType: MessageType.TEXT,
            content: texto,
            status: MessageStatus.SENT,
        });
        const saved = await this.messageRepo.save(mensaje);
        const numeroLimpio = conversation.phoneNumber.replace(/^521/, '52');

        try {
            const { data } = await axios.post(
                url,
                {
                    messaging_product: 'whatsapp',
                    to: numeroLimpio,
                    type: 'text',
                    text: { body: texto },
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );

            saved.whatsappMessageId = data?.messages?.[0]?.id;
            await this.messageRepo.save(saved);

            conversation.lastMessagePreview = texto;
            conversation.lastMessageOrigin =
                origen === MessageOrigin.BOT ? LastMessageOrigin.BOT : LastMessageOrigin.HUMANO;
            conversation.lastMessageAt = new Date();
            conversation.lastOutgoingMessageAt = new Date();
            await this.conversationRepo.save(conversation);

            return saved;
        } catch (error: any) {
            this.logger.error(
                'Error enviando a WhatsApp',
                error?.response?.data ?? error.message,
            );
            saved.status = MessageStatus.FAILED;
            saved.metadata = { error: error?.response?.data };
            await this.messageRepo.save(saved);
            throw error;
        }
    }

    // ================= ESTADOS =================

    private async actualizarEstadoMensaje(status: any): Promise<void> {
        const waId = status.id;
        const nuevoEstado = status.status as MessageStatus;
        if (!waId || !nuevoEstado) return;

        const mensaje = await this.messageRepo.findOne({
            where: { whatsappMessageId: waId },
        });
        if (!mensaje) return;

        mensaje.status = nuevoEstado;
        await this.messageRepo.save(mensaje);
    }

    async actualizarEstadosPorVentana(): Promise<void> {
        const ahora = Date.now();

        const abiertas = await this.conversationRepo
            .createQueryBuilder('c')
            .where('c.status != :closed', { closed: ConversationStatus.CLOSED })
            .andWhere('c.lastMessageAt IS NOT NULL')
            .getMany();

        if (abiertas.length === 0) return;

        const paraGuardar: Conversation[] = [];

        for (const conv of abiertas) {
            const lastAt = conv.lastMessageAt ? new Date(conv.lastMessageAt).getTime() : 0;
            const dentroVentana = ahora - lastAt < VENTANA_MS;

            if (!dentroVentana) {
                conv.status = ConversationStatus.CLOSED;
                paraGuardar.push(conv);
                continue;
            }

            if (conv.lastMessageOrigin === LastMessageOrigin.CLIENTE) {
                conv.status = ConversationStatus.PENDING;
            } else {
                conv.status = ConversationStatus.OPEN;
            }
            paraGuardar.push(conv);
        }

        if (paraGuardar.length > 0) {
            await this.conversationRepo.save(paraGuardar);
        }
    }

    // ================= API PARA EL FRONTEND =================

    async listarConversaciones(dto: ListConversationsDto) {
        await this.actualizarEstadosPorVentana();

        const { search, status, startDate, endDate, page = 1, limit = 7 } = dto;

        const qb = this.conversationRepo.createQueryBuilder('c');

        if (status) {
            qb.andWhere('c.status = :status', { status });
        }

        if (startDate) {
            qb.andWhere('c.lastMessageAt >= :start', {
                start: new Date(`${startDate}T00:00:00`),
            });
        }

        if (endDate) {
            qb.andWhere('c.lastMessageAt <= :end', {
                end: new Date(`${endDate}T23:59:59`),
            });
        }

        if (search && search.trim()) {
            const term = `%${search.trim().toLowerCase()}%`;
            qb.andWhere(
                '(LOWER(c.name) LIKE :term OR c.phoneNumber LIKE :term)',
                { term },
            );
        }

        const total = await qb.getCount();

        const statsQb = qb.clone();
        const todasFiltradas = await statsQb.getMany();

        const stats = {
            activas: todasFiltradas.filter((c) => c.status === ConversationStatus.OPEN).length,
            sinLeer: todasFiltradas.reduce((a, c) => a + (c.unreadCount ?? 0), 0),
            pendientes: todasFiltradas.filter((c) => c.status === ConversationStatus.PENDING).length,
            cerradas: todasFiltradas.filter((c) => c.status === ConversationStatus.CLOSED).length,
            botsActivos: todasFiltradas.filter((c) => c.botActivo).length,
        };

        const totalPages = Math.max(1, Math.ceil(total / limit));
        const safePage = Math.min(page, totalPages);
        const skip = (safePage - 1) * limit;

        const data = await qb
            .orderBy('c.lastMessageAt', 'DESC')
            .skip(skip)
            .take(limit)
            .getMany();

        return { data, total, page: safePage, limit, totalPages, stats };
    }

    async getConversacionConMensajes(id: number) {
        const conversation = await this.conversationRepo.findOne({ where: { id } });
        if (!conversation) throw new NotFoundException('Conversación no encontrada');

        if (conversation.unreadCount > 0) {
            conversation.unreadCount = 0;
            await this.conversationRepo.save(conversation);
        }

        const messages = await this.messageRepo.find({
            where: { conversation: { id } },
            order: { createdAt: 'ASC' },
        });

        return { conversation, messages };
    }

    async toggleBot(id: number, activo: boolean): Promise<Conversation> {
        const conversation = await this.conversationRepo.findOne({ where: { id } });
        if (!conversation) throw new NotFoundException('Conversación no encontrada');
        conversation.botActivo = activo;
        return this.conversationRepo.save(conversation);
    }

    async enviarMensajeHumano(conversationId: number, texto: string): Promise<Message> {
        const conversation = await this.conversationRepo.findOne({
            where: { id: conversationId },
        });
        if (!conversation) throw new NotFoundException('Conversación no encontrada');
        return this.enviarTexto(conversation, texto, MessageOrigin.HUMANO);
    }
}