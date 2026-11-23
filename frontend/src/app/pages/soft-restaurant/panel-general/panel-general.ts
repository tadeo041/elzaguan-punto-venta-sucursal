import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';
import {
  SoftRestaurantService,
  PanelGeneralResponse,
  ProductoVendido,
  TurnoActualDTO,
  VentasDelDia,
} from '../../../services/soft-restaurant';

type EstadoVista = 'skeleton' | 'empty' | 'data';

@Component({
  selector: 'app-panel-general',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './panel-general.html',
})
export class PanelGeneral implements OnInit {
  estadoVista: EstadoVista = 'skeleton';

  ventasDelDia: VentasDelDia = {
    total: 0, tickets: 0, ticketPromedio: 0, efectivo: 0, tarjeta: 0, otros: 0,
  };
  comparativa = { ayer: 0, semanaPasada: 0 };
  productosMasVendidos: ProductoVendido[] = [];
  turnoActual: TurnoActualDTO = {
    idturno: 0,
    nombre: 'Sin turno',
    fondoInicial: 0,
    ventasEfectivo: 0,
    ventasTarjeta: 0,
    retiros: 0,
    efectivoEsperado: 0,
    horaApertura: '',
    estado: 'cerrado',
  };

  public ventasPorHoraData: ChartData<'bar'> = {
    labels: [],
    datasets: [{ label: 'Ventas ($)', data: [], backgroundColor: '#D5720D', borderRadius: 6 }],
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
        data: [0, 0],
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

  private sr = inject(SoftRestaurantService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.cargar();
  }

  cargar(fecha?: string) {
    this.estadoVista = 'skeleton';
    this.sr.getPanelGeneral(fecha).subscribe({
      next: (data: PanelGeneralResponse) => {
        this.ventasDelDia = data.ventasDelDia;
        this.comparativa = data.comparativa;
        this.productosMasVendidos = data.productosMasVendidos;

        if (data.turnoActual) {
          this.turnoActual = data.turnoActual;
        } else {
          this.turnoActual = {
            idturno: 0,
            nombre: 'Sin turno abierto',
            fondoInicial: 0,
            ventasEfectivo: 0,
            ventasTarjeta: 0,
            retiros: 0,
            efectivoEsperado: 0,
            horaApertura: '',
            estado: 'cerrado',
          };
        }

        this.actualizarGraficos(data);
        this.estadoVista = data.ventasDelDia.tickets > 0 ? 'data' : 'empty';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando panel general', err);
        this.estadoVista = 'empty';
        this.cdr.detectChanges();
      },
    });
  }

  private actualizarGraficos(data: PanelGeneralResponse) {
    // Ventas por hora
    const horas = data.ventasPorHora.map((v) => `${v.hora}h`);
    const valores = data.ventasPorHora.map((v) => v.total);
    this.ventasPorHoraData = {
      labels: horas.length ? horas : ['Sin datos'],
      datasets: [
        {
          label: 'Ventas ($)',
          data: valores.length ? valores : [0],
          backgroundColor: '#D5720D',
          borderRadius: 6,
        },
      ],
    };

    // Método de pago
    this.metodoPagoData = {
      labels: ['Efectivo', 'Tarjeta'],
      datasets: [
        {
          data: [data.ventasDelDia.efectivo, data.ventasDelDia.tarjeta],
          backgroundColor: ['#16A34A', '#2563EB'],
          hoverBackgroundColor: ['#15803D', '#1D4ED8'],
          borderWidth: 0,
        },
      ],
    };
  }

  get cambioVsAyer(): number {
    if (!this.comparativa.ayer) return 0;
    return ((this.ventasDelDia.total - this.comparativa.ayer) / this.comparativa.ayer) * 100;
  }

  get cambioVsSemanaPasada(): number {
    if (!this.comparativa.semanaPasada) return 0;
    return ((this.ventasDelDia.total - this.comparativa.semanaPasada) / this.comparativa.semanaPasada) * 100;
  }
}