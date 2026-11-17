import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Department {
  id: number;
  slug: 'gerente' | 'meseros' | 'cocina';
  name: string;
  icon: string;
  sortOrder: number;
}

@Injectable({
  providedIn: 'root'
})
export class DepartmentsService {
  private apiUrl = '/api/departments';

  constructor(private http: HttpClient) { }

  // Solo lectura: el sistema ya tiene los 3 departamentos fijos
  getDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(this.apiUrl);
  }
}