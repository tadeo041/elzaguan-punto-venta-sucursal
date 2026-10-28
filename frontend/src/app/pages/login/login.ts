import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from "../../services/auth"
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class LoginComponent implements OnInit, OnDestroy {
  credentials = { username: '', password: '' };
  errorMessage = '';
  isLoading = false;

  // Lógica del Carrusel
  frases = [
    "Administra productos y existencias de manera rápida y organizada.",
    "Registra operaciones de venta con precisión y reportes inmediatos.",
    "Administra las propinas de tus meseros fácilmente en un solo lugar.",
    "Cobra los platillos de forma rápida y agiliza la atención en tu sucursal."
  ];
  fraseActual = 0;
  private intervalo: any;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.intervalo = setInterval(() => {
      this.fraseActual = (this.fraseActual + 1) % this.frases.length;
    }, 4000); // Cambia cada 4 segundos
  }

  ngOnDestroy() {
    if (this.intervalo) {
      clearInterval(this.intervalo);
    }
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error.message || 'Error al conectar con el servidor';
      }
    });
  }
}