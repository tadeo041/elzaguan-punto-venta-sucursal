import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MetricsService {
  private apiUrl = '/api/metrics';

  constructor(private http: HttpClient) { }

  getMetrics(period: string): Observable<any> {
    const params = new HttpParams().set('period', period);
    return this.http.get<any>(this.apiUrl, { params });
  }
}