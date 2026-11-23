import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfiguracionService } from '../../services/configuracion';
import { SoftRestaurantService, SoftRestaurantStatus } from '../../services/soft-restaurant';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './configuracion.html',
})
export class Configuracion implements OnInit {
  // WhatsApp
  form!: FormGroup;
  cargando = true;
  guardando = false;
  guardado = false;
  error = '';

  // Soft Restaurant
  srForm!: FormGroup;
  srCargando = true;
  srGuardando = false;
  srGuardado = false;
  srError = '';
  srStatus: SoftRestaurantStatus | null = null;
  srStatusCargando = false;

  constructor(
    private fb: FormBuilder,
    private configuracionService: ConfiguracionService,
    private softRestaurantService: SoftRestaurantService,
  ) {}

  ngOnInit() {
    // WhatsApp
    this.form = this.fb.group({
      phoneNumberId: ['', Validators.required],
      accessToken: [''],
      verifyToken: ['', Validators.required],
      apiVersion: ['v25.0', Validators.required],
      wabaId: [''],
    });

    // Soft Restaurant
    this.srForm = this.fb.group({
      server: ['', Validators.required],
      port: ['1433', Validators.required],
      database: ['', Validators.required],
      user: ['', Validators.required],
      password: [''],
    });

    this.cargarConfiguracion();
    this.cargarConfigSoftRestaurant();
  }

  // WhatsApp 
  cargarConfiguracion() {
    this.cargando = true;
    this.error = '';
    this.configuracionService.getWhatsappConfig().subscribe({
      next: (data) => {
        this.form.patchValue({
          phoneNumberId: data.phoneNumberId,
          accessToken: '',
          verifyToken: data.verifyToken,
          apiVersion: data.apiVersion,
          wabaId: data.wabaId,
        });
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando configuración', err);
        this.error = `No se pudo cargar la configuración (${err?.status ?? 'sin status'}).`;
        this.cargando = false;
      },
    });
  }

  guardar() {
    if (this.form.invalid || this.guardando) return;
    this.guardando = true;
    this.error = '';
    this.guardado = false;

    const payload: any = {
      phoneNumberId: this.form.value.phoneNumberId,
      verifyToken: this.form.value.verifyToken,
      apiVersion: this.form.value.apiVersion,
      wabaId: this.form.value.wabaId,
    };
    if (this.form.value.accessToken && this.form.value.accessToken.trim() !== '') {
      payload.accessToken = this.form.value.accessToken;
    }

    this.configuracionService.updateWhatsappConfig(payload).subscribe({
      next: () => {
        this.guardando = false;
        this.guardado = true;
        this.form.patchValue({ accessToken: '' });
        setTimeout(() => (this.guardado = false), 4000);
      },
      error: (err) => {
        this.guardando = false;
        this.error = `No se pudo guardar (${err?.status ?? 'sin status'}).`;
      },
    });
  }

  // Soft Restaurant 
  cargarConfigSoftRestaurant() {
    this.srCargando = true;
    this.srError = '';
    this.softRestaurantService.getConfig().subscribe({
      next: (data) => {
        this.srForm.patchValue({
          server: data.server ?? '',
          port: data.port ?? '1433',
          database: data.database ?? '',
          user: data.user ?? '',
          password: '',
        });
        this.srCargando = false;
        this.consultarEstadoSoftRestaurant();
      },
      error: (err) => {
        console.error('Error cargando config Soft Restaurant', err);
        this.srError = 'No se pudo cargar la configuración de Soft Restaurant.';
        this.srCargando = false;
      },
    });
  }

  guardarSoftRestaurant() {
    if (this.srForm.invalid || this.srGuardando) return;
    this.srGuardando = true;
    this.srError = '';
    this.srGuardado = false;

    const payload: any = {
      server: this.srForm.value.server,
      port: String(this.srForm.value.port),
      database: this.srForm.value.database,
      user: this.srForm.value.user,
    };
    if (this.srForm.value.password && this.srForm.value.password.trim() !== '') {
      payload.password = this.srForm.value.password;
    }

    this.softRestaurantService.updateConfig(payload).subscribe({
      next: () => {
        this.srGuardando = false;
        this.srGuardado = true;
        this.srForm.patchValue({ password: '' });
        this.consultarEstadoSoftRestaurant();
        setTimeout(() => (this.srGuardado = false), 4000);
      },
      error: (err) => {
        this.srGuardando = false;
        this.srError = `No se pudo guardar (${err?.status ?? 'sin status'}).`;
      },
    });
  }

  consultarEstadoSoftRestaurant() {
    this.srStatusCargando = true;
    this.softRestaurantService.getStatus().subscribe({
      next: (s) => {
        this.srStatus = s;
        this.srStatusCargando = false;
      },
      error: (err) => {
        this.srStatus = {
          estado: 'error',
          mensaje: `No se pudo consultar el estado (${err?.status ?? 'sin status'}).`,
        };
        this.srStatusCargando = false;
      },
    });
  }

  // Helpers para mostrar el badge
  get srBadgeClases(): string {
    switch (this.srStatus?.estado) {
      case 'conectado':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'sin_conexion':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'sin_configurar':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }

  get srBadgeTexto(): string {
    switch (this.srStatus?.estado) {
      case 'conectado': return 'Conectado';
      case 'sin_conexion': return 'Sin conexión';
      case 'sin_configurar': return 'Sin configurar';
      case 'error': return 'Error';
      default: return 'Desconocido';
    }
  }
}