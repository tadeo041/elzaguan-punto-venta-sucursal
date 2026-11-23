import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type UserRole = 'administrador' | 'gerente' | 'mesero' | 'cocinero';

export interface User {
  id: number;
  name: string;
  username: string;
  role: UserRole;
  isActive: boolean;
}

export interface UserFilters {
  id?: number | string;
  role?: UserRole | '';
  isActive?: 'true' | 'false' | '';
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  getUsers(filters?: UserFilters): Observable<User[]> {
    let params = new HttpParams();
    if (filters?.id) params = params.set('id', String(filters.id));
    if (filters?.role) params = params.set('role', filters.role);
    if (filters?.isActive) params = params.set('isActive', filters.isActive);

    return this.http.get<User[]>(this.apiUrl, { params });
  }

  getUser(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  createUser(user: any): Observable<User> {
    return this.http.post<User>(this.apiUrl, user);
  }

  updateUser(id: number, user: any): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}`, user);
  }

  toggleStatus(id: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/toggle-status`, {});
  }
}