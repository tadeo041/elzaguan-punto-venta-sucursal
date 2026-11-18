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
})
export class LoginComponent implements OnInit, OnDestroy {
  credentials = { username: '', password: '' };
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  // Controla si la contraseña se muestra en texto plano o no
  showPassword = false;

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

  // Alterna entre mostrar/ocultar la contraseña
  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (res) => {
        this.isLoading = false;
        // Mensaje de éxito (verde)
        this.successMessage = '¡Inicio de sesión correcto! Redirigiendo...';

        // Pequeña espera para que el usuario vea el mensaje antes de navegar
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1000);
      },
      error: (err) => {
        this.isLoading = false;
        // Mensaje de error: inputs se ponen rojos y aparece el tooltip
        this.errorMessage = err.error?.message || 'Usuario o contraseña incorrectos';
      }
    });
  }
}