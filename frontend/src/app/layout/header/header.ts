import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [],
  templateUrl: './header.html',
})
export class Header {
  // Inyectamos los servicios
  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  // Método para cerrar sesión
  cerrarSesion() {
    this.authService.logout(); // Borra el token y el usuario del localStorage
    this.router.navigate(['/login']); // Redirige al login
  }
}