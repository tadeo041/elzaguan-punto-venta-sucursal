import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ConfiguracionService {
    private apiUrl = `${environment.apiUrl}/configuracion`;
    constructor(private http: HttpClient) { }

    getWhatsappConfig(): Observable<any> {
        return this.http.get(`${this.apiUrl}/whatsapp`);
    }

    updateWhatsappConfig(config: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/whatsapp`, config);
    }
}