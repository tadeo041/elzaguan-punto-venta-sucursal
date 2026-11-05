import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { DepartmentsService } from '../../../services/departments';

import { ModalCrearDepartamento } from './modal-crear-departamento/modal-crear-departamento';
import { ModalEditarDepartamento } from './modal-editar-departamento/modal-editar-departamento';
import { ModalEliminarDepartamento } from './modal-eliminar-departamento/modal-eliminar-departamento';

@Component({
  selector: 'app-distribucion',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    BaseChartDirective, 
    ModalCrearDepartamento, 
    ModalEditarDepartamento,
    ModalEliminarDepartamento
  ],
  templateUrl: './distribucion.html',
})
export class Distribucion implements OnInit {
  // datos
  fechaInicio: string = '';
  textoFiltrosActivos: string = ''; 
  hayDepartamentos = false;
  loading = true;
  departamentos: any[] = [];
  totalTips = 0;

  // modales y menús
  modalCrearAbierto = false;
  modalEditarAbierto = false;
  modalEliminarAbierto = false;
  departamentoAEliminar: any = null;  
  departamentoAEditar: any = null;
  menuAbiertoId: number | null = null; 

  // iconos
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  svgIcons: { [key: string]: string } = {};

  // gráfico
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: [],
    datasets: [{
      data: [],
      backgroundColor: [],
      hoverBackgroundColor: [],
      borderWidth: 0
    }]
  };

  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '82%',
    plugins: { legend: { display: false } }
  };

  constructor(private departmentsService: DepartmentsService) {}

  ngOnInit() {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    this.fechaInicio = primerDia.toISOString().split('T')[0];

    this.cargarIconos();
    this.cargarDatos();
  }

  cargarIconos() {
    const iconos = ['cocina', 'gerente', 'limpieza', 'mesero', 'barra', 'cajero'];
    iconos.forEach(icono => {
      this.http.get(`icons/${icono}.svg`, { responseType: 'text' }).subscribe({
        next: (svg) => this.svgIcons[icono] = svg,
        error: () => console.warn(`Icono no encontrado: ${icono}.svg`)
      });
    });
  }

  cargarDatos() {
    this.loading = true;
    this.actualizarTextoFiltros();

    this.departmentsService.getDistribution(this.fechaInicio).subscribe({
      next: (res) => {
        this.totalTips = res.totalTips;
        let deps = res.distribution;

        // Calculamos el sobrante
        const totalAsignado = deps.reduce((sum: number, d: any) => sum + d.departmentTotal, 0);
        const sobrante = this.totalTips - totalAsignado;

        // Si hay sobrante, lo agregamos al arreglo
        if (sobrante > 0.01) {
          deps.push({
            id: 'sobrante',
            name: 'Sin asignar',
            icon: 'otros',
            departmentTotal: sobrante,
            individualAmount: sobrante,
            workerCount: 1,
            type: 'sobrante',
            value: 0
          });
        }

        this.departamentos = deps;
        this.hayDepartamentos = deps.length > 0;
        
        // Actualizamos los datos del gráfico
        this.doughnutChartData.labels = this.departamentos.map(d => d.name);
        this.doughnutChartData.datasets[0].data = this.departamentos.map(d => d.departmentTotal);
        
        this.doughnutChartData.datasets[0].backgroundColor = this.departamentos.map((d, i) => this.obtenerColor(i));
        this.doughnutChartData.datasets[0].hoverBackgroundColor = this.departamentos.map((d, i) => this.obtenerColorHover(i));
        
        this.doughnutChartData = { ...this.doughnutChartData };
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  actualizarTextoFiltros() {
    if (this.fechaInicio) {
      const fecha = new Date(this.fechaInicio + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      this.textoFiltrosActivos = `Fecha de inicio: ${fecha}`;
    } else {
      this.textoFiltrosActivos = '';
    }
  }

  obtenerColor(index: number): string {
    if (this.departamentos[index] && this.departamentos[index].type === 'sobrante') {
      return '#9CA3AF'; // Gray-400
    }
    const colores = ['#CA8A04', '#EA580C', '#DC2626', '#2563EB', '#7C3AED'];
    return colores[index % colores.length];
  }

  // Colores para el hover (un tono más oscuro para mantener la tonalidad)
  obtenerColorHover(index: number): string {
    if (this.departamentos[index] && this.departamentos[index].type === 'sobrante') {
      return '#6B7280'; // Gray-500
    }
    const coloresHover = ['#A16207', '#C2410C', '#B91C1C', '#1D4ED8', '#6D28D9'];
    return coloresHover[index % coloresHover.length];
  }

  obtenerColorFondo(index: number): string {
    if (this.departamentos[index] && this.departamentos[index].type === 'sobrante') {
      return 'rgba(156, 163, 175, 0.25)'; // Gray-400 con opacidad
    }
    const coloresBrillantes = [
      '250, 204, 21',
      '249, 115, 22',
      '252, 165, 165',
      '59, 130, 246',
      '167, 139, 250'
    ];
    const base = coloresBrillantes[index % coloresBrillantes.length];
    return `rgba(${base}, 0.25)`; 
  }

  obtenerIconoConColor(icono: string, color: string): SafeHtml {
    if (icono === 'otros' || !this.svgIcons[icono]) {
      const svgOtros = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="${color}" class="w-full h-full">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
        </svg>
      `;
      return this.sanitizer.bypassSecurityTrustHtml(svgOtros);
    }

    let svgString = this.svgIcons[icono];
    svgString = svgString.replace(/fill=".*?"/g, `fill="${color}"`)
                         .replace(/stroke=".*?"/g, `stroke="${color}"`);
    svgString = svgString.replace('<svg ', '<svg class="w-full h-full" ');

    return this.sanitizer.bypassSecurityTrustHtml(svgString);
  }

  abrirModalCrear() { this.modalCrearAbierto = true; }

  abrirModalEditar(dep: any) {
    this.departamentoAEditar = dep;
    this.modalEditarAbierto = true;
    this.menuAbiertoId = null; 
  }

  cerrarModales() {
    this.modalCrearAbierto = false;
    this.modalEditarAbierto = false;
    this.departamentoAEditar = null;
  }

  onDepartamentoGuardado() {
    this.cerrarModales();
    this.cargarDatos(); 
  }

  eliminarDepartamento(dep: any) {
    this.departamentoAEliminar = dep;
    this.modalEliminarAbierto = true;
    this.menuAbiertoId = null; 
  }

  cerrarModalEliminar() {
    this.modalEliminarAbierto = false;
    this.departamentoAEliminar = null;
  }
  
  onDepartamentoEliminado() {
    this.cerrarModalEliminar();
    this.cargarDatos(); 
  }  
}