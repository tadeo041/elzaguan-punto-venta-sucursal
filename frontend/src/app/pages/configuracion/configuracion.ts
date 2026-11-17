import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ConfiguracionService } from '../../services/configuracion';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './configuracion.html',
})
export class Configuracion implements OnInit {
  form!: FormGroup;
  cargando = true;
  guardando = false;
  guardado = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private configuracionService: ConfiguracionService,
  ) {}

  ngOnInit() {
    this.form = this.fb.group({
      phoneNumberId: ['', Validators.required],
      accessToken: [''],
      verifyToken: ['', Validators.required],
      apiVersion: ['v25.0', Validators.required],
      wabaId: [''],
    });

    this.cargarConfiguracion();
  }

  cargarConfiguracion() {
    this.cargando = true;
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
        this.error = 'No se pudo cargar la configuración.';
        this.cargando = false;
      }
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
        setTimeout(() => this.guardado = false, 4000);
      },
error: (err) => {
  console.error('Error cargando configuración', err);
  this.error = `No se pudo cargar la configuración (${err?.status ?? 'sin status'}). Revisa la consola y los logs del backend.`;
  this.cargando = false;
}
    });
  }
}