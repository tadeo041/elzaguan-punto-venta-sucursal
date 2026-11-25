import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tip, TipSource } from '../tips/tip.entity';

@Injectable()
export class MetricsService {
    constructor(@InjectRepository(Tip) private tipRepository: Repository<Tip>) { }

    private obtenerRangoFechas(period: string) {
        const hoy = new Date();
        let inicio = new Date();
        const fin = new Date();
        fin.setHours(23, 59, 59, 999);

        switch (period) {
            case 'day': inicio.setHours(0, 0, 0, 0); break;
            case 'week': {
                const diaSemana = hoy.getDay();
                const diferencia = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
                inicio.setDate(diferencia);
                inicio.setHours(0, 0, 0, 0);
                break;
            }
            case 'month': inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1); break;
            case 'year':  inicio = new Date(hoy.getFullYear(), 0, 1); break;
            default:      inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        }
        return { inicio, fin };
    }

    async getMetrics(period: string) {
        const { inicio, fin } = this.obtenerRangoFechas(period);

        const rawKpis = await this.tipRepository
            .createQueryBuilder('tip')
            .select('COALESCE(SUM(tip.amount), 0)', 'total')
            .addSelect('COALESCE(AVG(tip.amount), 0)', 'promedio')
            .addSelect('COALESCE(SUM(CASE WHEN tip.paymentType = 1 THEN tip.amount ELSE 0 END), 0)', 'efectivo')
            .addSelect('COALESCE(SUM(CASE WHEN tip.paymentType = 2 THEN tip.amount ELSE 0 END), 0)', 'tarjeta')
            .where('tip.createdAt BETWEEN :inicio AND :fin', { inicio, fin })
            .getRawOne();

        // Totales por origen (útil para mostrar en UI)
        const rawOrigen = await this.tipRepository
            .createQueryBuilder('tip')
            .select(`COALESCE(SUM(CASE WHEN tip.source = ${TipSource.MESA}   THEN tip.amount ELSE 0 END), 0)`, 'mesa')
            .addSelect(`COALESCE(SUM(CASE WHEN tip.source = ${TipSource.PEDIDO} THEN tip.amount ELSE 0 END), 0)`, 'pedido')
            .where('tip.createdAt BETWEEN :inicio AND :fin', { inicio, fin })
            .getRawOne();

        const graficoLinea = await this.tipRepository
            .createQueryBuilder('tip')
            .select('CAST(tip.createdAt AS date)', 'fecha')
            .addSelect('COALESCE(SUM(tip.amount), 0)', 'total')
            .where('tip.createdAt BETWEEN :inicio AND :fin', { inicio, fin })
            .groupBy('CAST(tip.createdAt AS date)')
            .orderBy('CAST(tip.createdAt AS date)', 'ASC')
            .getRawMany();

        // Promedio por mesa — SOLO MESA
        const graficoBarras = await this.tipRepository
            .createQueryBuilder('tip')
            .select('tip.tableNumber', 'mesa')
            .addSelect('COALESCE(AVG(tip.amount), 0)', 'promedio')
            .where('tip.createdAt BETWEEN :inicio AND :fin', { inicio, fin })
            .andWhere('tip.source = :source', { source: TipSource.MESA })
            .andWhere('tip.tableNumber IS NOT NULL')
            .groupBy('tip.tableNumber')
            .orderBy('promedio', 'DESC')
            .limit(10)
            .getRawMany();

        const graficoPastel = await this.tipRepository
            .createQueryBuilder('tip')
            .select('tip.paymentType', 'tipo')
            .addSelect('COALESCE(SUM(tip.amount), 0)', 'total')
            .where('tip.createdAt BETWEEN :inicio AND :fin', { inicio, fin })
            .groupBy('tip.paymentType')
            .getRawMany();

        const graficoTopMeseros = await this.tipRepository
            .createQueryBuilder('tip')
            .leftJoin('tip.receivedBy', 'receptor')
            .select('receptor.name', 'mesero')
            .addSelect('COALESCE(SUM(tip.amount), 0)', 'total')
            .where('tip.createdAt BETWEEN :inicio AND :fin', { inicio, fin })
            .groupBy('receptor.id')
            .addGroupBy('receptor.name')
            .orderBy('total', 'DESC')
            .limit(5)
            .getRawMany();

        const graficoHoras = await this.tipRepository
            .createQueryBuilder('tip')
            .select('EXTRACT(HOUR FROM tip.createdAt)', 'hora')
            .addSelect('COALESCE(SUM(tip.amount), 0)', 'total')
            .where('tip.createdAt BETWEEN :inicio AND :fin', { inicio, fin })
            .groupBy('EXTRACT(HOUR FROM tip.createdAt)')
            .orderBy('EXTRACT(HOUR FROM tip.createdAt)', 'ASC')
            .getRawMany();

        return {
            kpis: {
                totalPropinas: Number(rawKpis?.total) || 0,
                promedioPorMesa: Number(rawKpis?.promedio) || 0,
                totalEfectivo: Number(rawKpis?.efectivo) || 0,
                totalTarjeta: Number(rawKpis?.tarjeta) || 0,
                totalMesa: Number(rawOrigen?.mesa) || 0,
                totalPedido: Number(rawOrigen?.pedido) || 0,
            },
            graficoLineaTotal: graficoLinea.map((i) => ({ fecha: i.fecha, total: Number(i.total) })),
            graficoBarrasPromedio: graficoBarras.map((i) => ({ mesa: `Mesa ${i.mesa}`, promedio: Number(i.promedio) })),
            graficoPastelPagos: {
                efectivo: Number(graficoPastel.find((p) => Number(p.tipo) === 1)?.total) || 0,
                tarjeta: Number(graficoPastel.find((p) => Number(p.tipo) === 2)?.total) || 0,
            },
            graficoTopMeseros: graficoTopMeseros.map((i) => ({ mesero: i.mesero ?? 'Sin asignar', total: Number(i.total) })),
            graficoPropinasPorHora: graficoHoras.map((i) => ({ hora: this.formatearHora(String(i.hora)), total: Number(i.total) })),
        };
    }

    private formatearHora(hora24: string) {
        const hora = parseInt(hora24, 10);
        const ampm = hora >= 12 ? 'PM' : 'AM';
        const hora12 = hora % 12 || 12;
        return `${hora12}:00 ${ampm}`;
    }
}