import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

// ── Tipos que reflejan la respuesta del backend ──

export interface DailyConfig {
    id: number;
    date: string; // 'YYYY-MM-DD'
    gerenteCount: number;
    meseroCount: number;
    cocinaCount: number;
    gerenteRetardos: number;
    meseroRetardos: number;
    cocinaRetardos: number;
    totalTips: number;
    snapshot: RepartoResultado | null;
    confirmed: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AreaCalculada {
    name: string;              // 'Gerente' | 'Meseros' | 'Cocina'
    count: number;             // personas en el área
    retardos: number;          // personas que llegaron tarde
    bolsaFinal: number;        // total del área después de todo
    porPersonaBase: number;    // lo que le tocaría a cada uno antes de retardos
    montoTardio: number;       // lo que recibe cada persona tardía
    montoNormal: number;       // lo que recibe cada persona no tardía
    noTardios: number;
    tardios: number;
}

export interface RepartoResultado {
    date: string;
    totalTips: number;
    totalPersonas: number;
    basePorPersona: number;
    reglaEstructural: {
        aporteCocinaAMeseros: number;
    };
    areas: AreaCalculada[];
}

export interface UpdateDailyPayload {
    date: string;
    gerenteCount?: number;
    meseroCount?: number;
    cocinaCount?: number;
    gerenteRetardos?: number;
    meseroRetardos?: number;
    cocinaRetardos?: number;
}

@Injectable({
    providedIn: 'root'
})
export class DailyService {
    private apiUrl = '/api/daily';

    constructor(private http: HttpClient) { }

    /** Obtiene (o crea) la configuración del día */
    getDay(date: string): Observable<DailyConfig> {
        return this.http.get<DailyConfig>(`${this.apiUrl}/${date}`);
    }

    /** Actualiza cantidades y retardos (solo si NO está confirmado) */
    updateDay(date: string, payload: UpdateDailyPayload): Observable<DailyConfig> {
        return this.http.patch<DailyConfig>(`${this.apiUrl}/${date}`, payload);
    }

    /** Vista previa del reparto (no guarda) */
    preview(date: string): Observable<RepartoResultado> {
        return this.http.get<RepartoResultado>(`${this.apiUrl}/${date}/preview`);
    }

    /** Confirma el día y congela el snapshot histórico */
    confirm(date: string): Observable<{ message: string; config: DailyConfig }> {
        return this.http.post<{ message: string; config: DailyConfig }>(
            `${this.apiUrl}/${date}/confirm`,
            {},
        );
    }

    /** Historial de días confirmados (rango opcional) */
    history(from?: string, to?: string): Observable<DailyConfig[]> {
        let params = new HttpParams();
        if (from) params = params.set('from', from);
        if (to) params = params.set('to', to);
        return this.http.get<DailyConfig[]>(this.apiUrl, { params });
    }
}