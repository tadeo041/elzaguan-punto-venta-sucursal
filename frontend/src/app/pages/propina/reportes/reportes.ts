import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import { MetricsService } from '../../../services/metrics';

@Component({
  selector: 'app-metricas',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
  templateUrl: './reportes.html',
})
export class Reportes implements OnInit {
  periodoActual: string = 'month';
  loading = true;
  Math = Math;

  kpis = { totalPropinas: 0, promedioPorMesa: 0, totalEfectivo: 0, totalTarjeta: 0 };

  // 1. Gráfico de Línea (Total)
  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{ data: [], label: 'Total', borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#fff', pointBorderColor: '#3B82F6', pointBorderWidth: 2, pointRadius: 4 }]
  };
  public lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: true, color: '#f3f4f6' } }, y: { grid: { display: true, color: '#f3f4f6' } } }
  };

  // 2. Gráfico de Barras (Promedio Mesa)
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Promedio', backgroundColor: '#8B5CF6', borderRadius: 4, barThickness: 20 }]
  };
  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: true, color: '#f3f4f6' } }, y: { grid: { display: false } } }
  };

  // 3. Gráfico de Pastel (Pagos)
  public doughnutChartData: ChartData<'doughnut'> = {
    labels: ['Efectivo', 'Tarjeta'],
    datasets: [{ data: [], backgroundColor: ['#22C55E', '#3B82F6'], borderWidth: 0, hoverOffset: 4 }]
  };
  public doughnutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true, maintainAspectRatio: false, cutout: '75%',
    plugins: { legend: { display: false } }
  };

  // 4. Top Meseros (Barras Horizontales)
  public topMeserosChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ data: [], label: 'Total', backgroundColor: '#F59E0B', borderRadius: 4, barThickness: 20 }]
  };
  public topMeserosChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false, indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: true, color: '#f3f4f6' } }, y: { grid: { display: false } } }
  };

  // 5. Propinas por Hora (Línea de Tiempo)
  public horasChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{ data: [], label: 'Propinas', borderColor: '#EC4899', backgroundColor: 'rgba(236, 72, 153, 0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#fff', pointBorderColor: '#EC4899', pointBorderWidth: 2, pointRadius: 4 }]
  };
  public horasChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { display: true, color: '#f3f4f6' } }, y: { grid: { display: true, color: '#f3f4f6' } } }
  };

  constructor(private metricsService: MetricsService) {}

  ngOnInit() { this.cargarMetricas(); }

  cambiarPeriodo(periodo: string) {
    this.periodoActual = periodo;
    this.cargarMetricas();
  }

  cargarMetricas() {
    this.loading = true;
    this.metricsService.getMetrics(this.periodoActual).subscribe({
      next: (res) => {
        this.kpis = res.kpis;

        // 1. Línea Total
        this.lineChartData.labels = res.graficoLineaTotal.map((d: any) => d.fecha);
        this.lineChartData.datasets[0].data = res.graficoLineaTotal.map((d: any) => d.total);
        this.lineChartData = { ...this.lineChartData };

        // 2. Barras Promedio Mesa
        this.barChartData.labels = res.graficoBarrasPromedio.map((d: any) => d.mesa);
        this.barChartData.datasets[0].data = res.graficoBarrasPromedio.map((d: any) => d.promedio);
        this.barChartData = { ...this.barChartData };

        // 3. Pastel Pagos
        this.doughnutChartData.datasets[0].data = [res.graficoPastelPagos.efectivo, res.graficoPastelPagos.tarjeta];
        this.doughnutChartData = { ...this.doughnutChartData };

        // 4. Top Meseros (Agrupado)
        const meserosMap = new Map();
        res.graficoTopMeseros.forEach((m: any) => {
          meserosMap.set(m.mesero, (meserosMap.get(m.mesero) || 0) + m.total);
        });
        const meserosOrdenados = Array.from(meserosMap.entries()).map(([mesero, total]) => ({ mesero, total })).sort((a, b) => b.total - a.total);
        this.topMeserosChartData.labels = meserosOrdenados.map(m => m.mesero);
        this.topMeserosChartData.datasets[0].data = meserosOrdenados.map(m => m.total);
        this.topMeserosChartData = { ...this.topMeserosChartData };

        // 5. Línea Horas
        this.horasChartData.labels = res.graficoPropinasPorHora.map((d: any) => d.hora);
        this.horasChartData.datasets[0].data = res.graficoPropinasPorHora.map((d: any) => d.total);
        this.horasChartData = { ...this.horasChartData };

        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar métricas', err);
        this.loading = false;
      }
    });
  }
}