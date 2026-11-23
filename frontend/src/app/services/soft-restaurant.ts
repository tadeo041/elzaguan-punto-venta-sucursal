import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SoftRestaurantStatus {
    estado: 'sin_configurar' | 'conectado' | 'sin_conexion' | 'error';
    mensaje: string;
    server?: string;
    database?: string;
    latenciaMs?: number;
    fecha?: string;
}

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

export interface VentasDiaResponse {
    fecha: string;
    total: number;
    tickets: number;
}

@Injectable({ providedIn: 'root' })
export class SoftRestaurantService {
    private base = `${environment.apiUrl}/soft-restaurant`;
    private configBase = `${environment.apiUrl}/configuracion`;

    constructor(private http: HttpClient) { }

    getStatus(): Observable<SoftRestaurantStatus> {
        return this.http.get<SoftRestaurantStatus>(`${this.base}/status`);
    }

    getConfig(): Observable<any> {
        return this.http.get(`${this.configBase}/soft-restaurant`);
    }

    updateConfig(payload: any): Observable<any> {
        return this.http.put(`${this.configBase}/soft-restaurant`, payload);
    }

    getPanelGeneral(fecha?: string): Observable<PanelGeneralResponse> {
        const url = fecha
            ? `${this.base}/panel-general?fecha=${fecha}`
            : `${this.base}/panel-general`;
        return this.http.get<PanelGeneralResponse>(url);
    }

    getTurnoActual(): Observable<TurnoActualDTO | null> {
        return this.http.get<TurnoActualDTO | null>(`${this.base}/turno-actual`);
    }


    getVentasDia(fecha?: string): Observable<VentasDiaResponse> {
        const url = fecha
            ? `${this.base}/ventas-dia?fecha=${fecha}`
            : `${this.base}/ventas-dia`;
        return this.http.get<VentasDiaResponse>(url);
    }
}