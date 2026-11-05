import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
})
export class Header implements OnInit {
  menuAbierto = false;
  
  // Datos del usuario
  nombreUsuario: string = '';
  rolUsuario: string = '';
  iniciales: string = '';

  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarDatosUsuario();
  }

  cargarDatosUsuario() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      this.nombreUsuario = user.name;
      
      // Capitalizar el rol (ej. "gerente" -> "Gerente")
      this.rolUsuario = user.role.charAt(0).toUpperCase() + user.role.slice(1);
      
      // Sacar las iniciales (ej. "Manuel Díaz" -> "MD")
      const nombres = user.name.split(' ');
      if (nombres.length >= 2) {
        this.iniciales = nombres[0].charAt(0) + nombres[1].charAt(0);
      } else if (nombres.length === 1) {
        this.iniciales = nombres[0].substring(0, 2);
      }
    }
  }

  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  cerrarSesion() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}