import { Component, OnInit } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../app/services/auth';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;
  menuAbierto: string | null = 'propina';
  menuColapsadoAbierto: string | null = null;
  enRutaPropina = false;
  enRutaWhatsapp = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      const url = event.urlAfterRedirects;

      // Rutas activas
      this.enRutaPropina = url.includes('/propina');
      this.enRutaWhatsapp = url.includes('/whatsapp'); // <-- NUEVO

      // Auto-abrir el acordeón correspondiente (solo en modo expandido)
      if (this.enRutaPropina) {
        this.menuAbierto = 'propina';
      } else if (this.enRutaWhatsapp) {
        this.menuAbierto = 'whatsapp'; 
      }
    });
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.menuColapsadoAbierto = null;
  }

  toggleMenu(menu: string) {
    if (this.isCollapsed) {
      this.menuColapsadoAbierto = this.menuColapsadoAbierto === menu ? null : menu;
    } else {
      this.menuAbierto = this.menuAbierto === menu ? null : menu;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}