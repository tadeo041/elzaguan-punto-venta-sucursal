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

type AreaSlug = 'gerente' | 'meseros' | 'cocina';

interface BorradorArea {
  count: number;
  retardos: number;
}

@Component({
  selector: 'app-distribucion',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './distribucion.html',
})
export class Distribucion implements OnInit {
  fecha: string = '';
  loading = true;
  guardando = false;
  errorMessage = '';
  exitoMessage = '';

  config?: DailyConfig;
  preview?: RepartoResultado;
  departamentos: Department[] = [];

  editando: Record<AreaSlug, boolean> = {
    gerente: false,
    meseros: false,
    cocina: false,
  };

  borrador: Record<AreaSlug, BorradorArea> = {
    gerente: { count: 1, retardos: 0 },
    meseros: { count: 2, retardos: 0 },
    cocina: { count: 2, retardos: 0 },
  };

  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  svgIcons: { [key: string]: string } = {};

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
  }

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

  cargarDia() {
    if (!this.fecha) return;
    this.loading = true;
    this.errorMessage = '';
    this.exitoMessage = '';

    this.dailyService.getDay(this.fecha).subscribe({
      next: (config) => {
        this.config = config;
        this.resetBorradorDesdeConfig();
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

  resetBorradorDesdeConfig() {
    if (!this.config) return;
    this.borrador.gerente = { count: 1, retardos: this.config.gerenteRetardos };
    this.borrador.meseros = { count: this.config.meseroCount, retardos: this.config.meseroRetardos };
    this.borrador.cocina  = { count: this.config.cocinaCount,  retardos: this.config.cocinaRetardos };
  }

  activarEdicion(area: AreaSlug) {
    if (this.config?.confirmed) return;
    this.resetBorradorDesdeConfig();
    this.editando[area] = true;
  }

  cancelarEdicion(area: AreaSlug) {
    this.editando[area] = false;
    this.resetBorradorDesdeConfig();
  }

  guardarArea(area: AreaSlug) {
    if (!this.config || this.config.confirmed) return;

    const b = this.borrador[area];

    if (area === 'gerente') {
      if (b.retardos < 0 || b.retardos > 1) {
        this.errorMessage = 'El gerente solo puede tener 0 o 1 retardo.';
        return;
      }
    } else {
      if (!b.count || b.count < 1) {
        this.errorMessage = 'Debe haber al menos 1 persona en el área.';
        return;
      }
      if (b.retardos < 0) {
        this.errorMessage = 'Los retardos no pueden ser negativos.';
        return;
      }
      if (b.retardos > b.count) {
        this.errorMessage = 'Los retardos no pueden exceder la cantidad de personas.';
        return;
      }
    }

    this.guardando = true;
    this.errorMessage = '';

    this.dailyService
      .updateDay(this.fecha, {
        date: this.fecha,
        gerenteCount: 1,
        meseroCount: area === 'meseros' ? b.count : this.config.meseroCount,
        cocinaCount: area === 'cocina'  ? b.count : this.config.cocinaCount,
        gerenteRetardos: area === 'gerente' ? b.retardos : this.config.gerenteRetardos,
        meseroRetardos:  area === 'meseros' ? b.retardos : this.config.meseroRetardos,
        cocinaRetardos:  area === 'cocina'  ? b.retardos : this.config.cocinaRetardos,
      })
      .subscribe({
        next: (updated) => {
          this.config = updated;
          this.resetBorradorDesdeConfig();
          this.editando[area] = false;
          this.guardando = false;
          this.exitoMessage = 'Cambios guardados correctamente.';
          this.actualizarPreview();
          setTimeout(() => (this.exitoMessage = ''), 2500);
        },
        error: (err) => {
          this.guardando = false;
          this.errorMessage = err.error?.message || 'Error al guardar los cambios';
        },
      });
  }

  get totalTips(): number {
    return this.preview?.totalTips ?? 0;
  }

  get areas(): AreaCalculada[] {
    return this.preview?.areas ?? [];
  }

  areaPorNombre(nombre: string): AreaCalculada | undefined {
    return this.preview?.areas.find((a) => a.name === nombre);
  }

  slugDeArea(nombre: string): AreaSlug {
    switch (nombre) {
      case 'Gerente': return 'gerente';
      case 'Meseros': return 'meseros';
      case 'Cocina':  return 'cocina';
      default:        return 'meseros';
    }
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
}