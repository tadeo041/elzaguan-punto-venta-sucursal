import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tip, PaymentType } from './tip.entity';
import { TipHistory, ActionType } from './tip-history.entity';
import { CreateTipDto } from './create-tip.dto';
import { FilterTipDto } from './filter-tip.dto';
import { User } from '../users/user.entity';
import { localDayStartUtcIso, localNextDayStartUtcIso } from '../common/date-utils';

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

        const newTip = this.tipRepository.create({ ...tipData, receivedBy: receiver });
        const savedTip = await this.tipRepository.save(newTip);

        await this.historyRepository.save(
            this.historyRepository.create({
                tip: savedTip,
                action: ActionType.CREACION,
                newData: {
                    tableNumber: savedTip.tableNumber,
                    amount: Number(savedTip.amount),
                    paymentType: savedTip.paymentType,
                    receivedByName: receiver.name,
                },
                modifiedBy: { id: userId } as User,
            }),
        );

        return savedTip;
    }

    async findAllWithFilters(filters: FilterTipDto) {
        const {
            receivedById,
            paymentType,
            startDate,
            endDate,
            tzOffsetMin,
            page = 1,
            limit = 10,
        } = filters;

        const query = this.tipRepository
            .createQueryBuilder('tip')
            .leftJoinAndSelect('tip.receivedBy', 'receivedBy');

        if (receivedById) {
            query.andWhere('receivedBy.id = :receivedById', { receivedById });
        }
        if (paymentType) {
            query.andWhere('tip.paymentType = :paymentType', { paymentType });
        }

        const TZ = tzOffsetMin ?? -6 * 60;

        // ── Filtro de fechas sobre timestamptz (half-open [start, end)) ──
        if (startDate && endDate) {
            const start = localDayStartUtcIso(startDate, TZ);
            const end   = localNextDayStartUtcIso(endDate, TZ);
            query.andWhere('tip.createdAt >= :start AND tip.createdAt < :end', { start, end });
        } else if (startDate) {
            const start = localDayStartUtcIso(startDate, TZ);
            query.andWhere('tip.createdAt >= :start', { start });
        } else if (endDate) {
            // Solo hasta el final del `endDate` inclusive
            const end = localNextDayStartUtcIso(endDate, TZ);
            query.andWhere('tip.createdAt < :end', { end });
        }

        // ── Summary ──
        const summaryQuery = query.clone();
        const summary = await summaryQuery
            .select('COALESCE(SUM(tip.amount), 0)', 'total')
            .addSelect(
                `COALESCE(SUM(CASE WHEN tip.paymentType = ${PaymentType.EFECTIVO} THEN tip.amount ELSE 0 END), 0)`,
                'totalEfectivo',
            )
            .addSelect(
                `COALESCE(SUM(CASE WHEN tip.paymentType = ${PaymentType.TARJETA} THEN tip.amount ELSE 0 END), 0)`,
                'totalTarjeta',
            )
            .getRawOne();

        // ── Paginación ──
        query
            .orderBy('tip.createdAt', 'DESC')
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
                total: Number(summary?.total) || 0,
                totalEfectivo: Number(summary?.totalEfectivo) || 0,
                totalTarjeta: Number(summary?.totalTarjeta) || 0,
            },
        };
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
        tips.forEach((t) => {
            const monto = Number(t.amount);
            total += monto;
            if (t.paymentType === PaymentType.EFECTIVO) totalEfectivo += monto;
            if (t.paymentType === PaymentType.TARJETA) totalTarjeta += monto;
        });
        return { total, totalEfectivo, totalTarjeta };
    }

    async update(id: number, updateTipDto: any, userId: number) {
        const tip = await this.tipRepository.findOne({
            where: { id },
            relations: { receivedBy: true },
        });
        if (!tip) throw new NotFoundException('Propina no encontrada');

        let nuevoReceptor = tip.receivedBy;
        if (updateTipDto.receivedById && updateTipDto.receivedById !== tip.receivedBy?.id) {
            const receiver = await this.userRepository.findOne({
                where: { id: updateTipDto.receivedById },
            });
            if (!receiver) throw new NotFoundException('Usuario receptor no encontrado');
            nuevoReceptor = receiver;
        }

        if (updateTipDto.amount !== undefined && Number(updateTipDto.amount) !== Number(tip.amount)) {
            await this.historyRepository.save({
                tip,
                action: ActionType.CAMBIO_MONTO,
                previousData: { amount: Number(tip.amount) },
                newData: { amount: Number(updateTipDto.amount) },
                modifiedBy: { id: userId } as User,
            });
        }

        if (updateTipDto.receivedById && updateTipDto.receivedById !== tip.receivedBy?.id) {
            await this.historyRepository.save({
                tip,
                action: ActionType.CAMBIO_RECEPTOR,
                previousData: { receivedByName: tip.receivedBy?.name ?? null },
                newData: { receivedByName: nuevoReceptor?.name ?? null },
                modifiedBy: { id: userId } as User,
            });
        }

        if (updateTipDto.tableNumber !== undefined && Number(updateTipDto.tableNumber) !== Number(tip.tableNumber)) {
            await this.historyRepository.save({
                tip,
                action: ActionType.CAMBIO_MESA,
                previousData: { tableNumber: Number(tip.tableNumber) },
                newData: { tableNumber: Number(updateTipDto.tableNumber) },
                modifiedBy: { id: userId } as User,
            });
        }

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