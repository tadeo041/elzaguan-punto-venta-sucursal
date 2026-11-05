import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Tip } from '../tips/tip.entity';

@Injectable()
export class MetricsService {
    constructor(
        @InjectRepository(Tip)
        private tipRepository: Repository<Tip>,
    ) { }

    // Función auxiliar para calcular las fechas según el periodo
    private obtenerRangoFechas(period: string) {
        const hoy = new Date();
        let inicio = new Date();
        let fin = new Date();

        // Configuramos el fin del día de hoy (23:59:59)
        fin.setHours(23, 59, 59, 999);

        switch (period) {
            case 'day':
                inicio.setHours(0, 0, 0, 0);
                break;
            case 'week':
                // Lunes de la semana actual
                const diaSemana = hoy.getDay(); // 0 = Domingo, 1 = Lunes
                const diferencia = hoy.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
                inicio.setDate(diferencia);
                inicio.setHours(0, 0, 0, 0);
                break;
            case 'month':
                inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
                break;
            case 'year':
                inicio = new Date(hoy.getFullYear(), 0, 1);
                break;
            default:
                inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1); // Por defecto mes
        }
        return { inicio, fin };
    }

    async getMetrics(period: string) {
        const { inicio, fin } = this.obtenerRangoFechas(period);

        // 1. KPIs (Totales)
        const rawKpis = await this.tipRepository
            .createQueryBuilder('tip')
            .select('SUM(tip.amount)', 'total')
            .addSelect('AVG(tip.amount)', 'promedio')
            .addSelect('SUM(CASE WHEN tip.paymentType = 1 THEN tip.amount ELSE 0 END)', 'efectivo')
            .addSelect('SUM(CASE WHEN tip.paymentType = 2 THEN tip.amount ELSE 0 END)', 'tarjeta')
            .where('tip.createdAt BETWEEN :inicio AND :fin', { inicio, fin })
            .getRawOne();

        // 2. Gráfico de Línea (Total por fecha)
        const graficoLinea = await this.tipRepository
            .createQueryBuilder('tip')
            .select("DATE(tip.createdAt)", "fecha")
            .addSelect('SUM(tip.amount)', 'total')
            .where('tip.createdAt BETWEEN :inicio AND :fin', { inicio, fin })
            .groupBy("DATE(tip.createdAt)")
            .orderBy("DATE(tip.createdAt)", "ASC")
            .getRawMany();

        // 3. Gráfico de Barras (Promedio por Mesa)
        const graficoBarras = await this.tipRepository
            .createQueryBuilder('tip')
            .select('tip.tableNumber', 'mesa')
            .addSelect('AVG(tip.amount)', 'promedio')
            .where('tip.createdAt BETWEEN :inicio AND :fin', { inicio, fin })
            .groupBy('tip.tableNumber')
            .orderBy('promedio', 'DESC')
            .limit(10) // Top 10 mesas
            .getRawMany();

        // 4. Gráfico de Pastel (Método de Pago)
        const graficoPastel = await this.tipRepository
            .createQueryBuilder('tip')
            .select('tip.paymentType', 'tipo')
            .addSelect('SUM(tip.amount)', 'total')
            .where('tip.createdAt BETWEEN :inicio AND :fin', { inicio, fin })
            .groupBy('tip.paymentType')
            .getRawMany();

        // 5. Top Meseros (Barras Horizontales)
        const graficoTopMeseros = await this.tipRepository
            .createQueryBuilder('tip')
            .leftJoin('tip.waiter', 'waiter')
            .select('waiter.name', 'mesero')
            .addSelect('SUM(tip.amount)', 'total')
            .where('tip.createdAt BETWEEN :inicio AND :fin', { inicio, fin })
            .groupBy('waiter.id')
            .addGroupBy('waiter.name')
            .orderBy('total', 'DESC')
            .limit(5) // Top 5
            .getRawMany();

        // 6. Gráfico de Línea de Tiempo (Propinas por Hora)
        const graficoHoras = await this.tipRepository
            .createQueryBuilder('tip')
            .select("strftime('%H', tip.createdAt)", "hora")
            .addSelect('SUM(tip.amount)', 'total')
            .where('tip.createdAt BETWEEN :inicio AND :fin', { inicio, fin })
            .groupBy("strftime('%H', tip.createdAt)")
            .orderBy("hora", "ASC")
            .getRawMany();

        // 7. Formatear respuesta
        return {
            kpis: {
                totalPropinas: Number(rawKpis.total) || 0,
                promedioPorMesa: Number(rawKpis.promedio) || 0,
                totalEfectivo: Number(rawKpis.efectivo) || 0,
                totalTarjeta: Number(rawKpis.tarjeta) || 0,
            },
            graficoLineaTotal: graficoLinea.map(item => ({
                fecha: item.fecha,
                total: Number(item.total)
            })),
            graficoBarrasPromedio: graficoBarras.map(item => ({
                mesa: `Mesa ${item.mesa}`,
                promedio: Number(item.promedio)
            })),
            graficoPastelPagos: {
                efectivo: Number(graficoPastel.find(p => p.tipo === 1)?.total) || 0,
                tarjeta: Number(graficoPastel.find(p => p.tipo === 2)?.total) || 0,
            },
            graficoTopMeseros: graficoTopMeseros.map(item => ({
                mesero: item.mesero,
                total: Number(item.total)
            })),
            graficoPropinasPorHora: graficoHoras.map(item => ({
                hora: this.formatearHora(item.hora),
                total: Number(item.total)
            }))
        };
    }

    // Función auxiliar para AM/PM
    private formatearHora(hora24: string) {
        const hora = parseInt(hora24);
        const ampm = hora >= 12 ? 'PM' : 'AM';
        const hora12 = hora % 12 || 12;
        return `${hora12}:00 ${ampm}`;
    }
}