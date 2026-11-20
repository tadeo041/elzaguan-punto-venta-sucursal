import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Tip, PaymentType } from '../tips/tip.entity';
import { User } from '../users/user.entity';

const TOTAL_TIPS = 1000;
const MESES_ATRAS = 12;
const RECEPTOR_IDS = [1, 2, 3]; // IDs de usuarios que reciben propinas

@Injectable()
export class TipsSeedService implements OnApplicationBootstrap {
    private readonly logger = new Logger(TipsSeedService.name);

    constructor(
        @InjectRepository(Tip)
        private tipRepo: Repository<Tip>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
    ) { }

    async onApplicationBootstrap() {
        await this.seedTips();
    }

    private async seedTips() {
        // 1. Idempotencia: si ya hay propinas, no hacemos nada
        const count = await this.tipRepo.count();
        if (count > 0) {
            this.logger.log(`[Seed] Ya existen ${count} propinas. No se generan nuevas.`);
            return;
        }

        // 2. Buscar los receptores válidos (1, 2, 3)
        const receptores = await this.userRepo.find({
            where: { id: In(RECEPTOR_IDS) },
        });

        if (receptores.length === 0) {
            this.logger.warn(
                `[Seed] No se encontraron usuarios con id ${RECEPTOR_IDS.join(', ')}. ` +
                `No se generan propinas de prueba.`,
            );
            return;
        }

        this.logger.log(
            `[Seed] Generando ${TOTAL_TIPS} propinas de prueba ` +
            `con receptores: ${receptores.map((u) => `${u.id}-${u.name}`).join(', ')}`,
        );

        // 3. Rango de fechas: desde hace 12 meses hasta hoy
        const hoy = new Date();
        const inicio = new Date(hoy.getFullYear(), hoy.getMonth() - MESES_ATRAS, 1);
        const rangoMs = hoy.getTime() - inicio.getTime();

        // 4. Generar en lotes para no saturar SQLite
        const BATCH_SIZE = 200;
        const tips: Tip[] = [];

        for (let i = 0; i < TOTAL_TIPS; i++) {
            const tip = this.tipRepo.create({
                tableNumber: this.randomInt(1, 20),
                amount: this.randomAmount(),
                paymentType: this.randomPaymentType(),
                receivedBy: receptores[this.randomInt(0, receptores.length - 1)],
                createdAt: this.randomDate(inicio, rangoMs),
            });
            tips.push(tip);

            if (tips.length === BATCH_SIZE) {
                await this.tipRepo.save(tips);
                tips.length = 0; // vaciamos el lote
            }
        }

        // 5. Guardar el último lote (si quedó algo)
        if (tips.length > 0) {
            await this.tipRepo.save(tips);
        }

        const total = await this.tipRepo.count();
        this.logger.log(`[Seed] ${total} propinas en la base de datos.`);
    }

    // ── Helpers de aleatoriedad ────────────────────────────

    private randomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private randomAmount(): number {
        // Entre $10 y $150, con 2 decimales
        const raw = Math.random() * 140 + 10;
        return Math.round(raw * 100) / 100;
    }

    private randomPaymentType(): PaymentType {
        return Math.random() < 0.6 ? PaymentType.EFECTIVO : PaymentType.TARJETA;
    }

    private randomDate(inicio: Date, rangoMs: number): Date {
        // Día aleatorio en el rango
        const dia = new Date(inicio.getTime() + Math.random() * rangoMs);

        // Hora aleatoria entre 11:00 y 23:00
        const hora = this.randomInt(11, 22);
        const minuto = this.randomInt(0, 59);
        const segundo = this.randomInt(0, 59);

        dia.setHours(hora, minuto, segundo, 0);
        return dia;
    }
}