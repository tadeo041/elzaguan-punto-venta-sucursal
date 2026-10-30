import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../app/services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
})
export class SidebarComponent {
  isCollapsed = false;
  menuAbierto: string | null = 'propina'; 
  menuColapsadoAbierto: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

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