import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

interface ProductoVendido {
  nombre: string;
  cantidad: number;
  total: number;
}

interface TurnoActual {
  nombre: string;
  fondoInicial: number;
  ventasEfectivo: number;
  ventasTarjeta: number;
  retiros: number;
  efectivoEsperado: number;
  horaApertura: string;
  estado: 'abierto' | 'cerrado';
}

type EstadoVista = 'skeleton' | 'empty' | 'data';

@Component({
  selector: 'app-panel-general',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './panel-general.html',
})
export class PanelGeneral implements OnInit {
  estadoVista: EstadoVista = 'data';

  ventasDelDia = {
    total: 18540.50,
    tickets: 142,
    ticketPromedio: 130.57,
    efectivo: 9870.00,
    tarjeta: 8670.50,
  };

  comparativa = {
    ayer: 16200.00,
    semanaPasada: 17800.00,
  };

  productosMasVendidos: ProductoVendido[] = [
    { nombre: 'Tacos al pastor (orden)', cantidad: 48, total: 2160.00 },
    { nombre: 'Enchiladas verdes',        cantidad: 35, total: 1925.00 },
    { nombre: 'Cerveza Corona',           cantidad: 62, total: 1860.00 },
    { nombre: 'Pozole rojo',              cantidad: 22, total: 1760.00 },
    { nombre: 'Agua de horchata',         cantidad: 54, total: 1080.00 },
    { nombre: 'Flan napolitano',          cantidad: 30, total: 900.00 },
  ];

  turnoActual: TurnoActual = {
    nombre: 'Turno matutino',
    fondoInicial: 500.00,
    ventasEfectivo: 5670.00,
    ventasTarjeta: 4870.50,
    retiros: 3000.00,
    efectivoEsperado: 3170.00,
    horaApertura: '08:00 AM',
    estado: 'abierto',
  };

  public ventasPorHoraData: ChartData<'bar'> = {
    labels: ['12h', '13h', '14h', '15h', '16h', '17h', '18h', '19h', '20h', '21h'],
    datasets: [
      {
        label: 'Ventas ($)',
        data: [850, 1450, 2100, 1800, 950, 1200, 1900, 2400, 3100, 2790.50],
        backgroundColor: '#D5720D',
        borderRadius: 6,
      },
    ],
  };

  public ventasPorHoraOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v) => `$${v}` } },
      x: { grid: { display: false } },
    },
  };

  public metodoPagoData: ChartData<'doughnut'> = {
    labels: ['Efectivo', 'Tarjeta'],
    datasets: [
      {
        data: [9870.00, 8670.50],
        backgroundColor: ['#16A34A', '#2563EB'],
        hoverBackgroundColor: ['#15803D', '#1D4ED8'],
        borderWidth: 0,
      },
    ],
  };

  public metodoPagoOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: { legend: { display: false } },
  };

  get cambioVsAyer(): number {
    return ((this.ventasDelDia.total - this.comparativa.ayer) / this.comparativa.ayer) * 100;
  }

  get cambioVsSemanaPasada(): number {
    return ((this.ventasDelDia.total - this.comparativa.semanaPasada) / this.comparativa.semanaPasada) * 100;
  }

  ngOnInit() {
    // Aquí luego conectarás con la API / base de Soft Restaurant.
  }
}