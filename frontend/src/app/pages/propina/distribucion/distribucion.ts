import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

import { DepartmentsService, Department } from '../../../services/departments';
import {
  DailyService,
  DailyConfig,
  RepartoResultado,
  AreaCalculada,
} from '../../../services/daily';

@Component({
  selector: 'app-distribucion',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './distribucion.html',
})
export class Distribucion implements OnInit {
  // ── Estado de la pantalla ──
  fecha: string = '';
  loading = true;
  guardando = false;
  confirmando = false;
  errorMessage = '';

  // Datos del día
  config?: DailyConfig;
  preview?: RepartoResultado;

  // Catálogo fijo de áreas (solo para íconos/colores)
  departamentos: Department[] = [];

  // Historial
  historial: DailyConfig[] = [];
  mostrarHistorial = false;

  // Iconos SVG
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  svgIcons: { [key: string]: string } = {};

  // Gráfico
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      hoverBackgroundColor: [],
      borderWidth: 0,
    }],
  };

  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '82%',
    plugins: { legend: { display: false } },
  };

  constructor(
    private departmentsService: DepartmentsService,
    private dailyService: DailyService,
  ) {}

  ngOnInit() {
    const hoy = new Date().toISOString().split('T')[0];
    this.fecha = hoy;

    this.cargarIconos();
    this.cargarDepartamentos();
    this.cargarDia();
    this.cargarHistorial();
  }

  // ── Carga de catálogo e iconos ──

  cargarIconos() {
    const iconos = ['cocina', 'gerente', 'mesero'];
    iconos.forEach((icono) => {
      this.http.get(`icons/${icono}.svg`, { responseType: 'text' }).subscribe({
        next: (svg) => (this.svgIcons[icono] = svg),
        error: () => console.warn(`Icono no encontrado: ${icono}.svg`),
      });
    });
  }

  cargarDepartamentos() {
    this.departmentsService.getDepartments().subscribe({
      next: (deps) => (this.departamentos = deps),
      error: () => (this.departamentos = []),
    });
  }

  // ── Carga del día + preview ──

  cargarDia() {
    if (!this.fecha) return;
    this.loading = true;
    this.errorMessage = '';

    this.dailyService.getDay(this.fecha).subscribe({
      next: (config) => {
        this.config = config;
        this.actualizarPreview();
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error al cargar el día';
      },
    });
  }

  actualizarPreview() {
    this.dailyService.preview(this.fecha).subscribe({
      next: (p) => {
        this.preview = p;
        this.actualizarGrafico();
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Error al calcular el reparto';
      },
    });
  }

  // ── Edición ──

  guardarCambios() {
    if (!this.config || this.config.confirmed) return;
    this.guardando = true;
    this.errorMessage = '';

    this.dailyService
      .updateDay(this.fecha, {
        date: this.fecha,
        gerenteCount: this.config.gerenteCount,
        meseroCount: this.config.meseroCount,
        cocinaCount: this.config.cocinaCount,
        gerenteRetardos: this.config.gerenteRetardos,
        meseroRetardos: this.config.meseroRetardos,
        cocinaRetardos: this.config.cocinaRetardos,
      })
      .subscribe({
        next: (updated) => {
          this.config = updated;
          this.guardando = false;
          this.actualizarPreview();
        },
        error: (err) => {
          this.guardando = false;
          this.errorMessage = err.error?.message || 'Error al guardar cambios';
        },
      });
  }

  confirmarDia() {
    if (!this.config || this.config.confirmed) return;
    if (!confirm('¿Confirmar el reparto de este día? Ya no podrá modificarse.')) return;

    this.confirmando = true;
    this.errorMessage = '';

    this.dailyService.confirm(this.fecha).subscribe({
      next: () => {
        this.confirmando = false;
        this.cargarDia();
        this.cargarHistorial();
      },
      error: (err) => {
        this.confirmando = false;
        this.errorMessage = err.error?.message || 'Error al confirmar el día';
      },
    });
  }

  // ── Historial ──

  cargarHistorial() {
    const hoy = new Date();
    const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
      .toISOString()
      .split('T')[0];
    const hasta = hoy.toISOString().split('T')[0];

    this.dailyService.history(desde, hasta).subscribe({
      next: (dias) => (this.historial = dias),
      error: () => (this.historial = []),
    });
  }

  toggleHistorial() {
    this.mostrarHistorial = !this.mostrarHistorial;
  }

  seleccionarDia(dia: DailyConfig) {
    this.fecha = dia.date;
    this.mostrarHistorial = false;
    this.cargarDia();
  }

  // ── Helpers de UI ──

  get totalTips(): number {
    return this.preview?.totalTips ?? 0;
  }

  get areas(): AreaCalculada[] {
    return this.preview?.areas ?? [];
  }

  private actualizarGrafico() {
    const areas = this.areas;
    this.doughnutChartData.labels = areas.map((a) => a.name);
    this.doughnutChartData.datasets[0].data = areas.map((a) => a.bolsaFinal);
    this.doughnutChartData.datasets[0].backgroundColor = areas.map((_, i) => this.obtenerColor(i));
    this.doughnutChartData.datasets[0].hoverBackgroundColor = areas.map((_, i) => this.obtenerColorHover(i));
    this.doughnutChartData = { ...this.doughnutChartData };
  }

  obtenerColor(index: number): string {
    const colores = ['#CA8A04', '#EA580C', '#DC2626'];
    return colores[index % colores.length];
  }

  obtenerColorHover(index: number): string {
    const colores = ['#A16207', '#C2410C', '#B91C1C'];
    return colores[index % colores.length];
  }

  obtenerColorFondo(index: number): string {
    const colores = ['250, 204, 21', '249, 115, 22', '252, 165, 165'];
    return `rgba(${colores[index % colores.length]}, 0.25)`;
  }

  iconoDeArea(nombre: string): string {
    const map: Record<string, string> = {
      Gerente: 'gerente',
      Meseros: 'mesero',
      Cocina: 'cocina',
    };
    return map[nombre] ?? 'mesero';
  }

  obtenerIconoConColor(icono: string, color: string): SafeHtml {
    const svg = this.svgIcons[icono];
    if (!svg) {
      return this.sanitizer.bypassSecurityTrustHtml('');
    }
    let svgString = svg
      .replace(/fill=".*?"/g, `fill="${color}"`)
      .replace(/stroke=".*?"/g, `stroke="${color}"`);
    svgString = svgString.replace('<svg ', '<svg class="w-full h-full" ');
    return this.sanitizer.bypassSecurityTrustHtml(svgString);
  }

  // Validación rápida para deshabilitar botones
  get puedeGuardar(): boolean {
    return !!this.config && !this.config.confirmed && !this.guardando;
  }

  get puedeConfirmar(): boolean {
    return !!this.config && !this.config.confirmed && !this.confirmando && (this.preview?.totalPersonas ?? 0) > 0;
  }
}