import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TipsService {
  private apiUrl = '/api/tips';

  constructor(private http: HttpClient) { }

  getTips(filters: any): Observable<any> {
    let params = new HttpParams();

    if (filters.receivedById) params = params.set('receivedById', filters.receivedById);
    if (filters.paymentType) params = params.set('paymentType', filters.paymentType);
    if (filters.startDate) params = params.set('startDate', filters.startDate);
    if (filters.endDate) params = params.set('endDate', filters.endDate);
    if (filters.page) params = params.set('page', filters.page);
    if (filters.limit) params = params.set('limit', filters.limit);

    return this.http.get<any>(this.apiUrl, { params });
  }

  getResumen(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/resumen`);
  }

  createTip(tip: any): Observable<any> {
    return this.http.post(this.apiUrl, tip);
  }

  getTipDetails(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/details`);
  }

  updateTip(id: number, tip: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, tip);
  }
}