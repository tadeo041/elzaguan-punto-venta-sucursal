export interface VentasDelDia {
    total: number;
    tickets: number;
    ticketPromedio: number;
    efectivo: number;
    tarjeta: number;
    otros: number;
}

export interface Comparativa {
    ayer: number;
    semanaPasada: number;
}

export interface ProductoVendido {
    nombre: string;
    cantidad: number;
    total: number;
}

export interface TurnoActualDTO {
    idturno: number;
    nombre: string;
    fondoInicial: number;
    ventasEfectivo: number;
    ventasTarjeta: number;
    retiros: number;
    efectivoEsperado: number;
    horaApertura: string;
    estado: 'abierto' | 'cerrado';
}

export interface VentaHora {
    hora: number;
    total: number;
}

export interface PanelGeneralResponse {
    fecha: string;
    ventasDelDia: VentasDelDia;
    comparativa: Comparativa;
    productosMasVendidos: ProductoVendido[];
    turnoActual: TurnoActualDTO | null;
    ventasPorHora: VentaHora[];
}