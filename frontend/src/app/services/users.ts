import { Injectable } from '@angular/core';
import { HttpClient, HttpParams  } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = '/api/users';

  constructor(private http: HttpClient) { }

  // Obtener todos los usuarios (el backend los devuelve sin contraseñas)
  getUsers(filters?: any): Observable<any[]> {
    let params = new HttpParams();
    if (filters?.id) params = params.set('id', filters.id);
    if (filters?.role) params = params.set('role', filters.role);
    if (filters?.isActive) params = params.set('isActive', filters.isActive);
    
    return this.http.get<any[]>(this.apiUrl, { params });
  }

  // Si en el futuro necesitas crear un usuario desde Angular
  createUser(user: any): Observable<any> {
    return this.http.post(this.apiUrl, user);
  }
}