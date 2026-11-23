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
  // Estado inicial CERRADO
  isCollapsed = true;

  menuAbierto: string | null = 'propina';
  menuColapsadoAbierto: string | null = null;
  enRutaPropina = false;
  enRutaWhatsapp = false;

  userRole: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.userRole = this.authService.getUserRole() || null;

    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects;

        this.enRutaPropina = url.includes('/propina');
        this.enRutaWhatsapp = url.includes('/whatsapp');

        if (this.enRutaPropina) {
          this.menuAbierto = 'propina';
        } else if (this.enRutaWhatsapp) {
          this.menuAbierto = 'whatsapp';
        }
      });
  }

  /** Solo el administrador ve WhatsApp y Configuración */
  get isAdmin(): boolean {
    return this.userRole === 'administrador';
  }

  toggleSidebar() {
    this.isCollapsed = !this.isCollapsed;
    this.menuColapsadoAbierto = null;
  }

  toggleMenu(menu: string) {
    if (this.isCollapsed) {
      this.menuColapsadoAbierto =
        this.menuColapsadoAbierto === menu ? null : menu;
    } else {
      this.menuAbierto = this.menuAbierto === menu ? null : menu;
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}