import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tip, PaymentType } from './tip.entity';
import { TipHistory, ActionType } from './tip-history.entity';
import { CreateTipDto } from './create-tip.dto';
import { FilterTipDto } from './filter-tip.dto';
import { User } from '../users/user.entity';

@Injectable()
export class TipsService {
    constructor(
        @InjectRepository(Tip)
        private tipRepository: Repository<Tip>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        @InjectRepository(TipHistory)
        private historyRepository: Repository<TipHistory>,
    ) { }

    async create(createTipDto: CreateTipDto, userId: number) {
        const { receivedById, ...tipData } = createTipDto;

        const receiver = await this.userRepository.findOne({ where: { id: receivedById } });
        if (!receiver) throw new NotFoundException('Usuario receptor no encontrado');

        // 1. Guardamos la propina
        const newTip = this.tipRepository.create({ ...tipData, receivedBy: receiver });
        const savedTip = await this.tipRepository.save(newTip);

        // 2. Registro en el historial
        const history = this.historyRepository.create({
            tip: savedTip,
            action: ActionType.CREACION,
            newData: {
                tableNumber: savedTip.tableNumber,
                amount: Number(savedTip.amount),
                paymentType: savedTip.paymentType,
                receivedByName: receiver.name,
            },
            modifiedBy: { id: userId } as User,
        });
        await this.historyRepository.save(history);

        return savedTip;
    }

    async findAllWithFilters(filters: FilterTipDto) {
        const { receivedById, paymentType, startDate, endDate, page = 1, limit = 10 } = filters;

        const query = this.tipRepository.createQueryBuilder('tip')
            .leftJoinAndSelect('tip.receivedBy', 'receivedBy');

        if (receivedById) query.andWhere('receivedBy.id = :receivedById', { receivedById });
        if (paymentType) query.andWhere('tip.paymentType = :paymentType', { paymentType });

        // ⚠️ SQLite guarda createdAt como ISO UTC ("2026-11-18T02:00:00.000Z").
        // Para que el filtro coincida con la fecha LOCAL del usuario,
        // convertimos el rango local → UTC antes de comparar.
        const TZ_OFFSET_MIN = -6 * 60; // México (UTC-6). Ajusta si tu zona cambia.

        if (startDate && endDate) {
            const start = this.toUtcIso(startDate, false, TZ_OFFSET_MIN);
            const end   = this.toUtcIso(endDate,   true,  TZ_OFFSET_MIN);
            query.andWhere('tip.createdAt BETWEEN :start AND :end', { start, end });
        } else if (startDate) {
            const start = this.toUtcIso(startDate, false, TZ_OFFSET_MIN);
            query.andWhere('tip.createdAt >= :start', { start });
        } else if (endDate) {
            const end = this.toUtcIso(endDate, true, TZ_OFFSET_MIN);
            query.andWhere('tip.createdAt <= :end', { end });
        }

        const summaryQuery = query.clone();

        const summary = await summaryQuery
            .select('SUM(tip.amount)', 'total')
            .addSelect(`SUM(CASE WHEN tip.paymentType = ${PaymentType.EFECTIVO} THEN tip.amount ELSE 0 END)`, 'totalEfectivo')
            .addSelect(`SUM(CASE WHEN tip.paymentType = ${PaymentType.TARJETA} THEN tip.amount ELSE 0 END)`, 'totalTarjeta')
            .getRawOne();

        query.orderBy('tip.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [data, totalRecords] = await query.getManyAndCount();

        return {
            data,
            meta: {
                totalRecords,
                currentPage: page,
                totalPages: Math.ceil(totalRecords / limit),
                limit,
            },
            summary: {
                total: Number(summary.total) || 0,
                totalEfectivo: Number(summary.totalEfectivo) || 0,
                totalTarjeta: Number(summary.totalTarjeta) || 0,
            },
        };
    }

    /**
     * Convierte una fecha local "YYYY-MM-DD" al ISO UTC correspondiente.
     *
     * @param dateStr    Fecha local en formato "YYYY-MM-DD".
     * @param endOfDay   Si es `true`, usa 23:59:59.999 (fin del día);
     *                   si es `false`, usa 00:00:00.000 (inicio del día).
     * @param offsetMin  Offset de la zona horaria del usuario en minutos
     *                   (ej. México UTC-6 → -360).
     * @returns          String ISO UTC ("2026-11-18T06:00:00.000Z") que
     *                   SQLite compara lexicográficamente sin problema.
     */
    private toUtcIso(
        dateStr: string,
        endOfDay: boolean,
        offsetMin: number = -6 * 60,
    ): string {
        const [y, m, d] = dateStr.split('-').map(Number);
        const h  = endOfDay ? 23 : 0;
        const mi = endOfDay ? 59 : 0;
        const s  = endOfDay ? 59 : 0;
        const ms = endOfDay ? 999 : 0;

        // Construimos la fecha como si fuera UTC, luego le restamos el offset
        // del usuario para obtener el instante UTC real.
        const localAsUtc = Date.UTC(y, m - 1, d, h, mi, s, ms);
        const utc = new Date(localAsUtc - offsetMin * 60 * 1000);
        return utc.toISOString(); // "2026-11-18T06:00:00.000Z"
    }

    async getTipDetails(id: number) {
        const tip = await this.tipRepository.findOne({
            where: { id },
            relations: { receivedBy: true },
        });

        if (!tip) throw new NotFoundException('Propina no encontrada');

        const history = await this.historyRepository.find({
            where: { tip: { id } },
            relations: { modifiedBy: true },
            order: { createdAt: 'DESC' },
        });

        return { tip, history };
    }

    async getResumen() {
        const tips = await this.tipRepository.find();
        let total = 0, totalEfectivo = 0, totalTarjeta = 0;
        tips.forEach((tip) => {
            const monto = Number(tip.amount);
            total += monto;
            if (tip.paymentType === PaymentType.EFECTIVO) totalEfectivo += monto;
            if (tip.paymentType === PaymentType.TARJETA) totalTarjeta += monto;
        });
        return { total, totalEfectivo, totalTarjeta };
    }

    async update(id: number, updateTipDto: any, userId: number) {
        const tip = await this.tipRepository.findOne({
            where: { id },
            relations: { receivedBy: true },
        });
        if (!tip) throw new NotFoundException('Propina no encontrada');

        // Cambio de receptor
        let nuevoReceptor = tip.receivedBy;
        if (updateTipDto.receivedById && updateTipDto.receivedById !== tip.receivedBy?.id) {
            const receiver = await this.userRepository.findOne({ where: { id: updateTipDto.receivedById } });
            if (!receiver) throw new NotFoundException('Usuario receptor no encontrado');
            nuevoReceptor = receiver;
        }

        // Historial: monto
        if (updateTipDto.amount !== undefined && Number(updateTipDto.amount) !== Number(tip.amount)) {
            await this.historyRepository.save({
                tip,
                action: ActionType.CAMBIO_MONTO,
                previousData: { amount: Number(tip.amount) },
                newData: { amount: Number(updateTipDto.amount) },
                modifiedBy: { id: userId } as User,
            });
        }

        // Historial: receptor
        if (updateTipDto.receivedById && updateTipDto.receivedById !== tip.receivedBy?.id) {
            await this.historyRepository.save({
                tip,
                action: ActionType.CAMBIO_RECEPTOR,
                previousData: { receivedByName: tip.receivedBy?.name ?? null },
                newData: { receivedByName: nuevoReceptor?.name ?? null },
                modifiedBy: { id: userId } as User,
            });
        }

        // Historial: mesa
        if (updateTipDto.tableNumber !== undefined && Number(updateTipDto.tableNumber) !== Number(tip.tableNumber)) {
            await this.historyRepository.save({
                tip,
                action: ActionType.CAMBIO_MESA,
                previousData: { tableNumber: Number(tip.tableNumber) },
                newData: { tableNumber: Number(updateTipDto.tableNumber) },
                modifiedBy: { id: userId } as User,
            });
        }

        // Historial: tipo de pago
        if (updateTipDto.paymentType !== undefined && Number(updateTipDto.paymentType) !== Number(tip.paymentType)) {
            await this.historyRepository.save({
                tip,
                action: ActionType.CAMBIO_ENTREGA,
                previousData: { paymentType: Number(tip.paymentType) },
                newData: { paymentType: Number(updateTipDto.paymentType) },
                modifiedBy: { id: userId } as User,
            });
        }

        Object.assign(tip, {
            tableNumber: updateTipDto.tableNumber ?? tip.tableNumber,
            amount: updateTipDto.amount ?? tip.amount,
            paymentType: updateTipDto.paymentType ?? tip.paymentType,
            receivedBy: nuevoReceptor,
        });

        return await this.tipRepository.save(tip);
    }
}