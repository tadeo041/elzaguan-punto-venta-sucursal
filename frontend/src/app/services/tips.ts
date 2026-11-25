import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type TipSource = 1 | 2; // 1 = Mesa, 2 = Pedido
export type PaymentType = 1 | 2;

export interface Tip {
  id: number;
  tableNumber: number | null;
  amount: number;
  paymentType: PaymentType;
  source: TipSource;
  receivedBy?: { id: number; name: string };
  createdAt: string;
}

export interface CreateTipPayload {
  source: TipSource;
  tableNumber?: number; // requerido si source = 1
  amount: number;
  paymentType: PaymentType;
  receivedById: number;
}

export interface TipFilters {
  receivedById?: number;
  paymentType?: PaymentType;
  source?: TipSource;
  startDate?: string;
  endDate?: string;
  tzOffsetMin?: number;
  page?: number;
  limit?: number;
}

export interface TipListResponse {
  data: Tip[];
  meta: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  summary: {
    total: number;
    totalEfectivo: number;
    totalTarjeta: number;
  };
}

@Injectable({ providedIn: 'root' })
export class TipsService {
  private api = `${environment.apiUrl}/tips`;

  constructor(private http: HttpClient) { }

  create(payload: CreateTipPayload): Observable<Tip> {
    return this.http.post<Tip>(this.api, payload);
  }

  findAll(filters: TipFilters = {}): Observable<TipListResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        params = params.set(k, String(v));
      }
    });
    return this.http.get<TipListResponse>(this.api, { params });
  }

  getResumen(): Observable<{ total: number; totalEfectivo: number; totalTarjeta: number }> {
    return this.http.get<any>(`${this.api}/resumen`);
  }

  getTipDetails(id: number): Observable<{ tip: Tip; history: any[] }> {
    return this.http.get<{ tip: Tip; history: any[] }>(`${this.api}/${id}/details`);
  }

  update(id: number, payload: Partial<CreateTipPayload>): Observable<Tip> {
    return this.http.patch<Tip>(`${this.api}/${id}`, payload);
  }
}