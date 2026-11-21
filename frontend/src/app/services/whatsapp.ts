import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class WhatsappService {
private apiUrl = `${environment.apiUrl}/whatsapp`;
    constructor(private http: HttpClient) { }

    getConversaciones(filters: {
        search?: string;
        status?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
    } = {}): Observable<any> {
        let params = new HttpParams();
        if (filters.search) params = params.set('search', filters.search);
        if (filters.status) params = params.set('status', filters.status);
        if (filters.startDate) params = params.set('startDate', filters.startDate);
        if (filters.endDate) params = params.set('endDate', filters.endDate);
        if (filters.page) params = params.set('page', filters.page.toString());
        if (filters.limit) params = params.set('limit', filters.limit.toString());

        return this.http.get<any>(`${this.apiUrl}/conversations`, { params });
    }

    getConversacion(id: number): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/conversations/${id}`);
    }

    toggleBot(id: number, activo: boolean): Observable<any> {
        return this.http.patch(`${this.apiUrl}/conversations/${id}/bot`, { activo });
    }

    enviarMensaje(id: number, texto: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/conversations/${id}/messages`, { texto });
    }
}