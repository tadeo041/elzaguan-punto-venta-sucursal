import { Injectable, Logger } from '@nestjs/common';
import * as sql from 'mssql';
import { ConfiguracionService } from '../config/configuracion.service';
import {
    PanelGeneralResponse,
    ProductoVendido,
    TurnoActualDTO,
    VentaHora,
    VentasDelDia,
    Comparativa,
} from './dto/panel-general.dto';

export type EstadoConexion = 'sin_configurar' | 'conectado' | 'sin_conexion' | 'error';

export interface StatusConexion {
    estado: EstadoConexion;
    mensaje: string;
    server?: string;
    database?: string;
    latenciaMs?: number;
    fecha?: string;
}

@Injectable()
export class SoftRestaurantService {
    private readonly logger = new Logger(SoftRestaurantService.name);

    constructor(private readonly configService: ConfiguracionService) { }

    // ══════════════════════════════════════════════
    // CONEXIÓN (sin cambios)
    // ══════════════════════════════════════════════

    private construirConfig(): sql.config | null {
        const sr = this.configService.obtenerSoftRestaurant();
        if (!sr.server || !sr.database || !sr.user) return null;

        return {
            server: sr.server,
            port: Number(sr.port || 1433),
            database: sr.database,
            user: sr.user,
            password: sr.password,
            options: {
                encrypt: false,
                trustServerCertificate: true,
                enableArithAbort: true,
            },
            connectionTimeout: 5000,
            requestTimeout: 8000,
            pool: { max: 5, min: 0, idleTimeoutMillis: 30000 },
        };
    }

    private async conPool<T>(fn: (pool: sql.ConnectionPool) => Promise<T>): Promise<T> {
        const cfg = this.construirConfig();
        if (!cfg) throw new Error('SOFT_RESTAURANT_NO_CONFIG');
        const pool = new sql.ConnectionPool(cfg);
        try {
            await pool.connect();
            return await fn(pool);
        } finally {
            await pool.close().catch(() => { });
        }
    }

    async verificarConexion(): Promise<StatusConexion> {
        const cfg = this.construirConfig();
        if (!cfg) {
            return {
                estado: 'sin_configurar',
                mensaje: 'Faltan datos de conexión (server, database o user).',
            };
        }

        const inicio = Date.now();
        try {
            const resultado = await this.conPool(async (pool) => {
                const r = await pool.request().query<{ server: string; db: string }>(`
                    SELECT @@SERVERNAME AS server, DB_NAME() AS db
                `);
                return r.recordset[0];
            });

            return {
                estado: 'conectado',
                mensaje: 'Conexión establecida con Soft Restaurant.',
                server: resultado?.server ?? cfg.server,
                database: resultado?.db ?? cfg.database,
                latenciaMs: Date.now() - inicio,
                fecha: new Date().toISOString(),
            };
        } catch (err: any) {
            this.logger.warn(`Error conectando a Soft Restaurant: ${err.message}`);
            return {
                estado: 'sin_conexion',
                mensaje: this.traducirError(err),
                server: cfg.server,
                database: cfg.database,
                latenciaMs: Date.now() - inicio,
                fecha: new Date().toISOString(),
            };
        }
    }

    private traducirError(err: any): string {
        const msg = String(err?.message ?? err);
        if (msg.includes('SOFT_RESTAURANT_NO_CONFIG')) return 'Faltan datos de conexión.';
        if (msg.includes('Login failed')) return 'Credenciales incorrectas (usuario o contraseña).';
        if (msg.includes('Cannot open database')) return 'La base de datos no existe o no tienes permisos.';
        if (msg.includes('ECONNREFUSED')) return 'No se pudo conectar al servidor. ¿Está encendido?';
        if (msg.includes('ETIMEDOUT') || msg.includes('timeout')) return 'La conexión expiró. Verifica la red o firewall.';
        if (msg.includes('ENOTFOUND')) return 'El servidor no se encuentra en la red.';
        return msg;
    }

    async consultar<T = any>(query: string, params?: Record<string, any>): Promise<T[]> {
        return this.conPool(async (pool) => {
            const request = pool.request();
            if (params) {
                for (const [k, v] of Object.entries(params)) {
                    request.input(k, v);
                }
            }
            const r = await request.query(query);
            return r.recordset as T[];
        });
    }

    // ══════════════════════════════════════════════
    // PANEL GENERAL
    // ══════════════════════════════════════════════

    private fechaHoyISO(): string {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    private async obtenerVentasDelDia(fecha: string): Promise<VentasDelDia> {
        const rows = await this.consultar<any>(
            `
            SELECT
                COUNT(*)                 AS tickets,
                ISNULL(SUM(total), 0)    AS total,
                ISNULL(AVG(total), 0)    AS ticketPromedio,
                ISNULL(SUM(efectivo), 0) AS efectivo,
                ISNULL(SUM(tarjeta), 0)  AS tarjeta,
                ISNULL(SUM(otros), 0)    AS otros
            FROM cheques
            WHERE CAST(cierre AS date) = @fecha
              AND cancelado = 0
              AND pagado = 1
            `,
            { fecha },
        );
        const r = rows[0] ?? {};
        return {
            tickets: Number(r.tickets ?? 0),
            total: Number(r.total ?? 0),
            ticketPromedio: Number(r.ticketPromedio ?? 0),
            efectivo: Number(r.efectivo ?? 0),
            tarjeta: Number(r.tarjeta ?? 0),
            otros: Number(r.otros ?? 0),
        };
    }

    private async obtenerComparativas(fecha: string): Promise<Comparativa> {
        const rows = await this.consultar<any>(
            `
            SELECT
                ISNULL(SUM(CASE WHEN CAST(cierre AS date) = DATEADD(day, -1, @fecha) THEN total END), 0) AS ayer,
                ISNULL(SUM(CASE WHEN CAST(cierre AS date) = DATEADD(day, -7, @fecha) THEN total END), 0) AS semanaPasada
            FROM cheques
            WHERE cancelado = 0
              AND pagado = 1
              AND CAST(cierre AS date) IN (DATEADD(day, -1, @fecha), DATEADD(day, -7, @fecha))
            `,
            { fecha },
        );
        const r = rows[0] ?? {};
        return { ayer: Number(r.ayer ?? 0), semanaPasada: Number(r.semanaPasada ?? 0) };
    }

    private async obtenerVentasPorHora(fecha: string): Promise<VentaHora[]> {
        const rows = await this.consultar<any>(
            `
            SELECT DATEPART(HOUR, cierre) AS hora, SUM(total) AS total
            FROM cheques
            WHERE CAST(cierre AS date) = @fecha
              AND cancelado = 0
              AND pagado = 1
            GROUP BY DATEPART(HOUR, cierre)
            ORDER BY hora
            `,
            { fecha },
        );
        return rows.map((r) => ({ hora: Number(r.hora), total: Number(r.total) }));
    }

    private async obtenerProductosMasVendidos(fecha: string, limit = 10): Promise<ProductoVendido[]> {
        const rows = await this.consultar<any>(
            `
            SELECT TOP (@limit)
                p.descripcion                 AS nombre,
                SUM(d.cantidad)               AS cantidad,
                SUM(d.cantidad * d.precio)    AS total
            FROM cheqdet d
            INNER JOIN cheques c ON c.numcheque = CAST(d.foliodet AS numeric(8,0))
            INNER JOIN productos p ON p.idproducto = d.idproducto
            WHERE CAST(c.cierre AS date) = @fecha
              AND c.cancelado = 0
              AND c.pagado = 1
            GROUP BY p.descripcion
            ORDER BY cantidad DESC
            `,
            { fecha, limit },
        );
        return rows.map((r) => ({
            nombre: r.nombre,
            cantidad: Number(r.cantidad),
            total: Number(r.total),
        }));
    }

    private async obtenerRetirosTurno(idturno: number): Promise<number> {
        // IdCashMovementType 3 = COMPRAS EN EFECTIVO, 4 = SALVAGUARDAS
        const rows = await this.consultar<any>(
            `
            SELECT ISNULL(SUM(importe), 0) AS retiros
            FROM movtoscaja
            WHERE idturno = @idturno
              AND cancelado = 0
              AND IdCashMovementType IN (3, 4)
            `,
            { idturno },
        );
        return Number(rows[0]?.retiros ?? 0);
    }

    async obtenerTurnoActual(): Promise<TurnoActualDTO | null> {
        const turnos = await this.consultar<any>(`
            SELECT TOP 1 idturno, fondo, apertura, cierre, efectivo, tarjeta, cajero, idestacion
            FROM turnos
            WHERE cierre IS NULL
            ORDER BY apertura DESC
        `);

        if (!turnos.length) return null;

        const t = turnos[0];
        const retiros = await this.obtenerRetirosTurno(Number(t.idturno));
        const fondo = Number(t.fondo ?? 0);
        const ventasEfectivo = Number(t.efectivo ?? 0);
        const ventasTarjeta = Number(t.tarjeta ?? 0);

        return {
            idturno: Number(t.idturno),
            nombre: t.cajero ? `Turno ${t.cajero}` : `Turno #${t.idturno}`,
            fondoInicial: fondo,
            ventasEfectivo,
            ventasTarjeta,
            retiros,
            efectivoEsperado: fondo + ventasEfectivo - retiros,
            horaApertura: t.apertura ? new Date(t.apertura).toISOString() : '',
            estado: 'abierto',
        };
    }

    async obtenerPanelGeneral(fecha?: string): Promise<PanelGeneralResponse> {
        const f = fecha ?? this.fechaHoyISO();

        const [ventasDelDia, comparativa, ventasPorHora, productosMasVendidos, turnoActual] =
            await Promise.all([
                this.obtenerVentasDelDia(f),
                this.obtenerComparativas(f),
                this.obtenerVentasPorHora(f),
                this.obtenerProductosMasVendidos(f, 10),
                this.obtenerTurnoActual(),
            ]);

        return {
            fecha: f,
            ventasDelDia,
            comparativa,
            productosMasVendidos,
            turnoActual,
            ventasPorHora,
        };
    }


    async obtenerTotalVentasDia(fecha?: string): Promise<{ fecha: string; total: number; tickets: number }> {
        const f = fecha ?? this.fechaHoyISO();
        const rows = await this.consultar<any>(
            `
    SELECT
      COUNT(*)              AS tickets,
      ISNULL(SUM(total), 0) AS total
    FROM cheques
    WHERE CAST(cierre AS date) = @fecha
      AND cancelado = 0
      AND pagado = 1
    `,
            { fecha: f },
        );
        return {
            fecha: f,
            total: Number(rows[0]?.total ?? 0),
            tickets: Number(rows[0]?.tickets ?? 0),
        };
    }
}