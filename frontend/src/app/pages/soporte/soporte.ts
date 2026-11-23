import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-soporte',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './soporte.html',
})
export class Soporte implements OnInit {
  preguntaAbierta: string | null = null;
  userRole: string | null = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.userRole = this.authService.getUserRole() || null;
  }

  /** Solo el administrador ve las FAQs de WhatsApp y Configuración */
  get isAdmin(): boolean {
    return this.userRole === 'administrador';
  }

  togglePregunta(id: string): void {
    this.preguntaAbierta = this.preguntaAbierta === id ? null : id;
  }
}