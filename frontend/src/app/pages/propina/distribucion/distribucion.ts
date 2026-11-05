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

@Component({
  selector: 'app-distribucion',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    BaseChartDirective, 
    ModalCrearDepartamento, 
    ModalEditarDepartamento
  ],
  templateUrl: './distribucion.html',
})
export class Distribucion implements OnInit {
  // datos
  fechaInicio: string = '';
  textoFiltrosActivos: string = ''; // <-- Nueva variable para el texto
  hayDepartamentos = false;
  loading = true;
  departamentos: any[] = [];
  totalTips = 0;

  // modales y menús
  modalCrearAbierto = false;
  modalEditarAbierto = false;
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
      backgroundColor: ['#CA8A04', '#EA580C', '#DC2626', '#2563EB', '#7C3AED'],
      hoverBackgroundColor: ['#A16207', '#C2410C', '#B91C1C', '#1D4ED8', '#6D28D9'],
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

  // carga los svgs de la carpeta public
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
    this.actualizarTextoFiltros(); // <-- Actualizamos el texto cada vez que se busca

    this.departmentsService.getDistribution(this.fechaInicio).subscribe({
      next: (res) => {
        this.totalTips = res.totalTips;
        this.departamentos = res.distribution;
        this.hayDepartamentos = this.departamentos.length > 0;
        
        this.doughnutChartData.labels = this.departamentos.map(d => d.name);
        this.doughnutChartData.datasets[0].data = this.departamentos.map(d => d.departmentTotal);
        this.doughnutChartData = { ...this.doughnutChartData };
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  // método para generar el texto del filtro aplicado
  actualizarTextoFiltros() {
    if (this.fechaInicio) {
      const fecha = new Date(this.fechaInicio + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      this.textoFiltrosActivos = `Fecha de inicio: ${fecha}`;
    } else {
      this.textoFiltrosActivos = '';
    }
  }

  // colores fuertes para texto/icono
  obtenerColor(index: number): string {
    const colores = ['#CA8A04', '#EA580C', '#DC2626', '#2563EB', '#7C3AED'];
    return colores[index % colores.length];
  }

  // colores de fondo suaves
  obtenerColorFondo(index: number): string {
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

  // devuelve el svg con el color aplicado o el icono de otros
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

  eliminarDepartamento(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar este departamento?')) {
      console.log('Eliminando departamento con ID:', id);
      this.menuAbiertoId = null;
      this.cargarDatos(); 
    }
  }
}