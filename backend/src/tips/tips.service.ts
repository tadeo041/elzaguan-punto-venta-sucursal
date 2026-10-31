import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Tip, PaymentType } from './tip.entity';
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
    ) { }

    async create(createTipDto: CreateTipDto) {
        const { waiterId, ...tipData } = createTipDto;
        const waiter = await this.userRepository.findOne({ where: { id: waiterId } });
        if (!waiter) throw new NotFoundException('Mesero no encontrado');

        const newTip = this.tipRepository.create({ ...tipData, waiter });
        return await this.tipRepository.save(newTip);
    }

    // --- NUEVO MÉTODO CON FILTROS Y PAGINACIÓN ---
    async findAllWithFilters(filters: FilterTipDto) {
        const { waiterId, paymentType, startDate, endDate, page = 1, limit = 10 } = filters;

        // 1. Iniciamos el QueryBuilder
        const query = this.tipRepository.createQueryBuilder('tip')
            .leftJoinAndSelect('tip.waiter', 'waiter'); // Traemos los datos del mesero

        // 2. Aplicamos filtros dinámicamente
        if (waiterId) {
            query.andWhere('waiter.id = :waiterId', { waiterId });
        }

        if (paymentType) {
            query.andWhere('tip.paymentType = :paymentType', { paymentType });
        }

        // 3. Filtro de fechas (Por defecto, si no envían nada, buscamos el mes actual)
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

        // 4. Clonamos la query para calcular los totales ANTES de aplicar paginación
        const summaryQuery = query.clone();

        // Ejecutamos la sumatoria
        const summary = await summaryQuery
            .select('SUM(tip.amount)', 'total')
            .addSelect(`SUM(CASE WHEN tip.paymentType = ${PaymentType.EFECTIVO} THEN tip.amount ELSE 0 END)`, 'totalEfectivo')
            .addSelect(`SUM(CASE WHEN tip.paymentType = ${PaymentType.TARJETA} THEN tip.amount ELSE 0 END)`, 'totalTarjeta')
            .getRawOne();

        // 5. Aplicamos paginación a la consulta principal
        query.orderBy('tip.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        // 6. Ejecutamos la consulta de datos
        const [data, totalRecords] = await query.getManyAndCount();

        // 7. Devolvemos todo estructurado
        return {
            data, // Las propinas de esta página
            meta: {
                totalRecords, // Cuántos registros hay en total con esos filtros
                currentPage: page,
                totalPages: Math.ceil(totalRecords / limit),
                limit,
            },
            summary: {
                // Convertimos a número porque SUM devuelve string en algunas BD
                total: Number(summary.total) || 0,
                totalEfectivo: Number(summary.totalEfectivo) || 0,
                totalTarjeta: Number(summary.totalTarjeta) || 0,
            }
        };
    }

    // Mantenemos el resumen simple por si acaso
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
}