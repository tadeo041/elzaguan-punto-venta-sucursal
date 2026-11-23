import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuracion } from './entities/configuracion.entity';

const CLAVES_WHATSAPP = [
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_VERIFY_TOKEN',
    'WHATSAPP_API_VERSION',
    'WHATSAPP_WABA_ID',
];

const CLAVES_SOFT_RESTAURANT = [
    'SR_SERVER',
    'SR_PORT',
    'SR_DATABASE',
    'SR_USER',
    'SR_PASSWORD',
];

@Injectable()
export class ConfiguracionService implements OnModuleInit {
    private readonly logger = new Logger(ConfiguracionService.name);
    private cache = new Map<string, string>();

    constructor(
        @InjectRepository(Configuracion)
        private configRepo: Repository<Configuracion>,
    ) {}

    async onModuleInit() {
        await this.cargarDesdeEnv();
        await this.recargarCache();
        this.logger.log(`Configuración cargada: ${this.cache.size} claves`);
    }

    private async cargarDesdeEnv() {
        const todas = [...CLAVES_WHATSAPP, ...CLAVES_SOFT_RESTAURANT];
        for (const clave of todas) {
            const existente = await this.configRepo.findOne({ where: { clave } });
            if (!existente) {
                const valorEnv = process.env[clave];
                if (valorEnv) {
                    await this.configRepo.save({ clave, valor: valorEnv });
                    this.logger.log(`Sembrando ${clave} desde .env`);
                }
            }
        }
    }

    private async recargarCache() {
        const items = await this.configRepo.find();
        this.cache.clear();
        items.forEach(item => this.cache.set(item.clave, item.valor));
    }

    obtener(clave: string): string | undefined {
        return this.cache.get(clave);
    }

    async actualizar(clave: string, valor: string): Promise<void> {
        await this.configRepo.save({ clave, valor });
        this.cache.set(clave, valor);
    }

    async actualizarVarias(items: Record<string, string>): Promise<void> {
        for (const [clave, valor] of Object.entries(items)) {
            if (valor !== undefined && valor !== null && valor !== '') {
                await this.configRepo.save({ clave, valor });
                this.cache.set(clave, valor);
            }
        }
    }

    obtenerSoftRestaurant() {
        return {
            server: this.obtener('SR_SERVER') ?? '',
            port: this.obtener('SR_PORT') ?? '1433',
            database: this.obtener('SR_DATABASE') ?? '',
            user: this.obtener('SR_USER') ?? '',
            password: this.obtener('SR_PASSWORD') ?? '',
        };
    }
}