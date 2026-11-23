import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './homePague.html',
})
export class Dashboard implements OnInit {
  userRole: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole() || null;
  }

  /** Solo el administrador tiene acceso completo a WhatsApp e Inventario */
  get isAdmin(): boolean {
    return this.userRole === 'administrador';
  }
}