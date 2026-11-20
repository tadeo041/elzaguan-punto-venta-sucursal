import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalRegistrar } from './modal-registrar/modal-registrar';
import { ModalDetalle } from './modal-detalle/modal-detalle';
import { TipsService } from '../../../services/tips';
import { UsersService } from '../../../services/users';

@Component({
  selector: 'app-panel-general',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalRegistrar, ModalDetalle],
  templateUrl: './panel-general.html',
})
export class PanelGeneralComponent implements OnInit {
  estadoVista: 'skeleton' | 'data' | 'empty' = 'skeleton';

  meseroAbierto = false;
  tipoAbierto = false;

  filtros = {
    receivedById: '',
    paymentType: '',
    startDate: '',
    endDate: ''
  };

  textoFiltrosActivos: string = '';

  propinas: any[] = [];
  meseros: any[] = [];
  resumen = { total: 0, totalEfectivo: 0, totalTarjeta: 0 };

  currentPage = 1;
  totalPages = 1;
  totalRecords = 0;
  pageSize = 7;
  Math = Math;

  modalAbierto = false;
  propinaAEditar: any = null;

  modalDetalleAbierto = false;
  tipSeleccionadaId: number | null = null;

  constructor(
    private tipsService: TipsService,
    private usersService: UsersService
  ) { }

  ngOnInit() {
    this.inicializarFechasPorDefecto();
    this.cargarMeseros();
    this.cargarPropinas();
  }

  inicializarFechasPorDefecto() {
    const hoy = new Date();
    const hoyStr = this.formatearFecha(hoy);

    this.filtros.startDate = hoyStr;
    this.filtros.endDate = hoyStr;

    this.actualizarTextoFiltros();
  }

  formatearFecha(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }

  actualizarTextoFiltros() {
    let textos = [];

    if (this.filtros.startDate && this.filtros.endDate) {
      const inicio = new Date(this.filtros.startDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      const fin = new Date(this.filtros.endDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      textos.push(`Fecha: ${inicio} - ${fin}`);
    }

    if (this.filtros.paymentType) {
      const tipo = this.filtros.paymentType === '1' ? 'Efectivo' : 'Tarjeta';
      textos.push(`Tipo: ${tipo}`);
    }

    if (this.filtros.receivedById) {
      const mesero = this.meseros.find(m => m.id == this.filtros.receivedById);
      if (mesero) textos.push(`Mesero: ${mesero.name}`);
    }

    this.textoFiltrosActivos = textos.length > 0 ? textos.join(' | ') : '';
  }

  cargarMeseros() {
    this.usersService.getUsers({ isActive: 'true' }).subscribe({
      next: (users) => {
        const rolesPermitidos = ['mesero', 'cajero', 'gerente'];
        this.meseros = users.filter(u => rolesPermitidos.includes(u.role));
        this.actualizarTextoFiltros();
      },
      error: (err) => console.error('Error al cargar meseros', err)
    });
  }

  cargarPropinas() {
    this.estadoVista = 'skeleton';
    this.actualizarTextoFiltros();

    const tzOffsetMin = -new Date().getTimezoneOffset();

    this.tipsService.getTips({
      ...this.filtros,
      tzOffsetMin,
      page: this.currentPage,
      limit: this.pageSize
    }).subscribe({
      next: (response) => {
        this.resumen = response.summary;
        this.currentPage = response.meta.currentPage;
        this.totalPages = response.meta.totalPages;
        this.totalRecords = response.meta.totalRecords;

        if (response.data.length === 0) {
          this.propinas = [];
          this.estadoVista = 'empty';
        } else {
          this.propinas = response.data;
          this.estadoVista = 'data';
        }
      },
      error: (err) => {
        console.error('Error al cargar propinas', err);
        this.estadoVista = 'empty';
        this.resumen = { total: 0, totalEfectivo: 0, totalTarjeta: 0 };
        this.totalRecords = 0;
      }
    });
  }

  aplicarFiltros() {
    this.currentPage = 1;
    this.cargarPropinas();
  }

  limpiarFiltros() {
    const hoy = new Date();
    const hoyStr = this.formatearFecha(hoy);

    this.filtros = {
      receivedById: '',
      paymentType: '',
      startDate: hoyStr,
      endDate: hoyStr
    };

    this.aplicarFiltros();
  }

  cambiarPaginaSiguiente() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.cargarPropinas();
    }
  }

  cambiarPaginaAnterior() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cargarPropinas();
    }
  }

  cambiarTamanoPagina(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.pageSize = Number(target.value);
    this.currentPage = 1;
    this.cargarPropinas();
  }

  abrirModalRegistro() {
    this.propinaAEditar = null;
    this.modalAbierto = true;
  }

  abrirModalEditar(propina: any) {
    this.propinaAEditar = propina;
    this.modalAbierto = true;
  }

  onPropinaGuardada() {
    this.modalAbierto = false;
    this.propinaAEditar = null;
    this.cargarPropinas();
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.propinaAEditar = null;
  }

  abrirModalDetalle(id: number) {
    this.tipSeleccionadaId = id;
    this.modalDetalleAbierto = true;
  }

  cerrarModalDetalle() {
    this.modalDetalleAbierto = false;
    this.tipSeleccionadaId = null;
  }
}