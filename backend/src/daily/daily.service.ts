import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { DailyConfig } from './daily-config.entity';
import { CreateDailyConfigDto } from './create-daily-config.dto';
import { Tip } from '../tips/tip.entity';
import { localDayStartUtcIso, localNextDayStartUtcIso } from '../common/date-utils';

const STRUCTURAL_TRANSFER_RATE = 0.25;
const LATE_PENALTY_RATE = 0.20;

const AREA_GERENTE = 'Gerente';
const AREA_MESEROS = 'Meseros';
const AREA_COCINA  = 'Cocina';

type AreaKey = typeof AREA_GERENTE | typeof AREA_MESEROS | typeof AREA_COCINA;

export interface AreaCalculada {
    name: string;
    count: number;
    retardos: number;
    bolsaFinal: number;
    porPersonaBase: number;
    montoTardio: number;
    montoNormal: number;
    noTardios: number;
    tardios: number;
}

export interface RepartoResultado {
    date: string;
    totalTips: number;
    totalPersonas: number;
    basePorPersona: number;
    reglaEstructural: { aporteCocinaAMeseros: number };
    areas: AreaCalculada[];
}

@Injectable()
export class DailyService {
    constructor(
        @InjectRepository(DailyConfig)
        private dailyRepo: Repository<DailyConfig>,
        @InjectRepository(Tip)
        private tipRepo: Repository<Tip>,
    ) { }

    async getOrCreate(date: string) {
        let config = await this.dailyRepo.findOne({ where: { date } });
        if (!config) {
            config = this.dailyRepo.create({
                date,
                gerenteCount: 1,
                meseroCount: 2,
                cocinaCount: 2,
                gerenteRetardos: 0,
                meseroRetardos: 0,
                cocinaRetardos: 0,
                totalTips: 0,
                snapshot: null,
                confirmed: false,
            });
            config = await this.dailyRepo.save(config);
        }
        return config;
    }

    async update(date: string, dto: CreateDailyConfigDto) {
        const config = await this.getOrCreate(date);
        if (config.confirmed) {
            throw new ConflictException('Este día ya fue confirmado. No se puede modificar.');
        }

        const gCount = dto.gerenteCount ?? config.gerenteCount;
        const mCount = dto.meseroCount ?? config.meseroCount;
        const cCount = dto.cocinaCount ?? config.cocinaCount;
        const gRet = dto.gerenteRetardos ?? config.gerenteRetardos;
        const mRet = dto.meseroRetardos ?? config.meseroRetardos;
        const cRet = dto.cocinaRetardos ?? config.cocinaRetardos;

        if (gRet > gCount) throw new BadRequestException('Retardos de gerente no pueden exceder la cantidad de gerentes');
        if (mRet > mCount) throw new BadRequestException('Retardos de meseros no pueden exceder la cantidad de meseros');
        if (cRet > cCount) throw new BadRequestException('Retardos de cocina no pueden exceder la cantidad de cocineros');

        Object.assign(config, dto);
        return await this.dailyRepo.save(config);
    }

    async preview(date: string, tzOffsetMin: number = -360): Promise<RepartoResultado> {
        const config = await this.getOrCreate(date);
        const totalTips = await this.getTotalTipsForDate(date, tzOffsetMin);
        return this.calculate(config, totalTips);
    }

    async confirm(date: string, tzOffsetMin: number = -360) {
        const config = await this.getOrCreate(date);
        if (config.confirmed) throw new ConflictException('Este día ya fue confirmado.');

        const totalTips = await this.getTotalTipsForDate(date, tzOffsetMin);
        const result = this.calculate(config, totalTips);

        config.totalTips = totalTips;
        config.snapshot = result;
        config.confirmed = true;
        await this.dailyRepo.save(config);

        return { message: 'Día confirmado y snapshot guardado', config };
    }

    async history(from?: string, to?: string) {
        const where: any = { confirmed: true };
        if (from && to) where.date = Between(from, to);
        else if (from) where.date = Between(from, '9999-12-31');
        else if (to) where.date = Between('0000-01-01', to);

        return await this.dailyRepo.find({ where, order: { date: 'DESC' } });
    }

    async findOne(date: string) {
        const config = await this.dailyRepo.findOne({ where: { date } });
        if (!config) throw new NotFoundException('Día no encontrado');
        return config;
    }

    private async getTotalTipsForDate(date: string, tzOffsetMin: number = -360): Promise<number> {
        const start = localDayStartUtcIso(date, tzOffsetMin);
        const end   = localNextDayStartUtcIso(date, tzOffsetMin);

        const raw = await this.tipRepo
            .createQueryBuilder('tip')
            .select('COALESCE(SUM(tip.amount), 0)', 'total')
            .where('tip.createdAt >= :start AND tip.createdAt < :end', { start, end })
            .getRawOne();

        return Number(raw?.total) || 0;
    }

    private calculate(config: DailyConfig, totalTips: number): RepartoResultado {
        const totalPersonas = config.gerenteCount + config.meseroCount + config.cocinaCount;

        if (totalPersonas <= 0) {
            return {
                date: config.date,
                totalTips: Number(totalTips.toFixed(2)),
                totalPersonas: 0,
                basePorPersona: 0,
                reglaEstructural: { aporteCocinaAMeseros: 0 },
                areas: [],
            };
        }

        const basePorPersona = totalTips / totalPersonas;
        const bolsas: Record<AreaKey, number> = {
            [AREA_GERENTE]: basePorPersona * config.gerenteCount,
            [AREA_MESEROS]: basePorPersona * config.meseroCount,
            [AREA_COCINA]:  basePorPersona * config.cocinaCount,
        };

        const aporteCocina = bolsas[AREA_COCINA] * STRUCTURAL_TRANSFER_RATE;
        bolsas[AREA_COCINA] -= aporteCocina;
        bolsas[AREA_MESEROS] += aporteCocina;

        const areasInfo = [
            { key: AREA_GERENTE as AreaKey, count: config.gerenteCount, retardos: config.gerenteRetardos },
            { key: AREA_MESEROS as AreaKey, count: config.meseroCount, retardos: config.meseroRetardos },
            { key: AREA_COCINA as AreaKey,  count: config.cocinaCount,  retardos: config.cocinaRetardos },
        ].filter((a) => a.count > 0);

        interface ResultadoInterno {
            count: number;
            retardos: number;
            bolsa: number;
            porPersona: number;
            montoTardio: number;
            montoNormal: number;
            excedente: number;
        }

        const resultado: Record<string, ResultadoInterno> = {};

        areasInfo.forEach((area) => {
            const bolsa = bolsas[area.key];
            const individual = bolsa / area.count;
            const descuentoPorRetardo = individual * LATE_PENALTY_RATE;

            const tardios = Math.min(area.retardos, area.count);
            const noTardios = area.count - tardios;
            const totalDescontado = descuentoPorRetardo * tardios;
            const montoTardio = individual - descuentoPorRetardo;

            if (noTardios > 0) {
                const extraPorNoTardio = totalDescontado / noTardios;
                resultado[area.key] = {
                    count: area.count,
                    retardos: tardios,
                    bolsa,
                    porPersona: individual,
                    montoTardio,
                    montoNormal: individual + extraPorNoTardio,
                    excedente: 0,
                };
            } else {
                resultado[area.key] = {
                    count: area.count,
                    retardos: tardios,
                    bolsa: bolsa - totalDescontado,
                    porPersona: individual,
                    montoTardio,
                    montoNormal: 0,
                    excedente: totalDescontado,
                };
            }
        });

        const areasConExcedente = areasInfo.filter((a) => resultado[a.key].excedente > 0);
        const totalExcedente = areasConExcedente.reduce((s, a) => s + resultado[a.key].excedente, 0);

        if (totalExcedente > 0) {
            let receptores = areasInfo.filter((a) => !areasConExcedente.some((e) => e.key === a.key));
            if (receptores.length === 0) receptores = areasInfo;

            const porReceptor = totalExcedente / receptores.length;
            receptores.forEach((r) => {
                const info = resultado[r.key];
                const noTardiosReceptor = info.count - info.retardos;
                if (noTardiosReceptor > 0) {
                    info.montoNormal += porReceptor / noTardiosReceptor;
                } else {
                    info.montoTardio += porReceptor / info.count;
                }
                info.bolsa += porReceptor;
            });
        }

        const areas: AreaCalculada[] = areasInfo.map((a) => {
            const info = resultado[a.key];
            return {
                name: a.key,
                count: info.count,
                retardos: info.retardos,
                bolsaFinal: Number(info.bolsa.toFixed(2)),
                porPersonaBase: Number(info.porPersona.toFixed(2)),
                montoTardio: Number(info.montoTardio.toFixed(2)),
                montoNormal: Number(info.montoNormal.toFixed(2)),
                noTardios: info.count - info.retardos,
                tardios: info.retardos,
            };
        });

        return {
            date: config.date,
            totalTips: Number(totalTips.toFixed(2)),
            totalPersonas,
            basePorPersona: Number(basePorPersona.toFixed(2)),
            reglaEstructural: { aporteCocinaAMeseros: Number(aporteCocina.toFixed(2)) },
            areas,
        };
    }
}