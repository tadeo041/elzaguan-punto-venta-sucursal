import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DepartmentsService {
  private apiUrl = '/api/departments';

  constructor(private http: HttpClient) { }

  // Obtener departamentos
  getDepartments(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Crear departamento
  createDepartment(department: any): Observable<any> {
    return this.http.post(this.apiUrl, department);
  }

  // Actualizar departamento
  updateDepartment(id: number, department: any): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}`, department);
  }

  // Obtener la distribución calculada desde una fecha
  getDistribution(startDate: string): Observable<any> {
    const params = new HttpParams().set('startDate', startDate);
    return this.http.get<any>(`${this.apiUrl}/distribution`, { params });
  }
}