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
        const { waiterId, ...tipData } = createTipDto;

        const waiter = await this.userRepository.findOne({ where: { id: waiterId } });
        if (!waiter) throw new NotFoundException('Mesero no encontrado');

        // 1. Guardamos la propina
        const newTip = this.tipRepository.create({ ...tipData, waiter });
        const savedTip = await this.tipRepository.save(newTip);

        // 2. Creamos el registro en el historial (Inicio de registro)
        const history = this.historyRepository.create({
            tip: savedTip,
            action: ActionType.CREACION,
            newData: {
                tableNumber: savedTip.tableNumber,
                amount: Number(savedTip.amount),
                paymentType: savedTip.paymentType,
                waiterName: waiter.name
            },
            modifiedBy: { id: userId } as User // Guardamos quién lo hizo
        });
        await this.historyRepository.save(history);

        return savedTip;
    }

    async findAllWithFilters(filters: FilterTipDto) {
        const { waiterId, paymentType, startDate, endDate, page = 1, limit = 10 } = filters;

        const query = this.tipRepository.createQueryBuilder('tip')
            .leftJoinAndSelect('tip.waiter', 'waiter');

        if (waiterId) query.andWhere('waiter.id = :waiterId', { waiterId });
        if (paymentType) query.andWhere('tip.paymentType = :paymentType', { paymentType });

        if (startDate && endDate) {
            query.andWhere('tip.createdAt BETWEEN :startDate AND :endDate', {
                startDate: `${startDate} 00:00:00`,
                endDate: `${endDate} 23:59:59`,
            });
        } else if (startDate) {
            query.andWhere('tip.createdAt >= :startDate', { startDate: `${startDate} 00:00:00` });
        } else if (endDate) {
            query.andWhere('tip.createdAt <= :endDate', { endDate: `${endDate} 23:59:59` });
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
            }
        };
    }

    // NUEVO MÉTODO: Obtener detalle e historial
    async getTipDetails(id: number) {
        const tip = await this.tipRepository.findOne({
            where: { id },
            relations: {
                waiter: true // <-- Objeto en lugar de arreglo
            }
        });

        if (!tip) throw new NotFoundException('Propina no encontrada');

        const history = await this.historyRepository.find({
            where: { tip: { id } },
            relations: {
                modifiedBy: true // <-- Objeto en lugar de arreglo
            },
            order: { createdAt: 'DESC' }
        });

        return {
            tip,
            history
        };
    }

    async getResumen() {
        const tips = await this.tipRepository.find();
        let total = 0, totalEfectivo = 0, totalTarjeta = 0;
        tips.forEach(tip => {
            const monto = Number(tip.amount);
            total += monto;
            if (tip.paymentType === PaymentType.EFECTIVO) totalEfectivo += monto;
            if (tip.paymentType === PaymentType.TARJETA) totalTarjeta += monto;
        });
        return { total, totalEfectivo, totalTarjeta };
    }

    async update(id: number, updateTipDto: any, userId: number) {
        // 1. Buscamos la propina original con su mesero actual
        const tip = await this.tipRepository.findOne({
            where: { id },
            relations: { waiter: true }
        });
        if (!tip) throw new NotFoundException('Propina no encontrada');

        // 2. Buscamos al nuevo mesero (si es que lo cambiaron)
        let nuevoMesero = tip.waiter;
        if (updateTipDto.waiterId && updateTipDto.waiterId !== tip.waiter.id) {
            const waiter = await this.userRepository.findOne({ where: { id: updateTipDto.waiterId } });
            if (!waiter) throw new NotFoundException('Mesero no encontrado');
            nuevoMesero = waiter;
        }

        // 3. Evaluamos los cambios y guardamos en el historial

        // Cambio de Propina (Monto)
        if (Number(updateTipDto.amount) !== Number(tip.amount)) {
            await this.historyRepository.save({
                tip: tip,
                action: ActionType.CAMBIO_MONTO,
                previousData: { amount: Number(tip.amount) },
                newData: { amount: Number(updateTipDto.amount) },
                modifiedBy: { id: userId } as User
            });
        }

        // Cambio de Mesero
        if (updateTipDto.waiterId && updateTipDto.waiterId !== tip.waiter.id) {
            await this.historyRepository.save({
                tip: tip,
                action: ActionType.CAMBIO_MESERO,
                previousData: { waiterName: tip.waiter.name },
                newData: { waiterName: nuevoMesero.name },
                modifiedBy: { id: userId } as User
            });
        }

        // Cambio de N° Mesa
        if (Number(updateTipDto.tableNumber) !== Number(tip.tableNumber)) {
            await this.historyRepository.save({
                tip: tip,
                action: ActionType.CAMBIO_MESA,
                previousData: { tableNumber: Number(tip.tableNumber) },
                newData: { tableNumber: Number(updateTipDto.tableNumber) },
                modifiedBy: { id: userId } as User
            });
        }

        // Cambio de Tipo de Pago (Efectivo/Tarjeta)
        if (Number(updateTipDto.paymentType) !== Number(tip.paymentType)) {
            await this.historyRepository.save({
                tip: tip,
                action: ActionType.CAMBIO_ENTREGA,
                previousData: { paymentType: Number(tip.paymentType) },
                newData: { paymentType: Number(updateTipDto.paymentType) },
                modifiedBy: { id: userId } as User
            });
        }

        // 4. Finalmente, actualizamos la propina en la tabla principal
        Object.assign(tip, {
            tableNumber: updateTipDto.tableNumber,
            amount: updateTipDto.amount,
            paymentType: updateTipDto.paymentType,
            waiter: nuevoMesero
        });

        return await this.tipRepository.save(tip);
    }
}