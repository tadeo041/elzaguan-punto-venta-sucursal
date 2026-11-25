import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, debounceTime } from 'rxjs';

import { TipsService } from '../../../services/tips';
import { TipListResponse } from '../../../services/tips';
import { UsersService } from '../../../services/users';

import { ModalRegistrar } from './modal-registrar/modal-registrar';
import { ModalDetalle } from './modal-detalle/modal-detalle';

type VistaEstado = 'skeleton' | 'empty' | 'data';

interface Mesero {
  id: number;
  name: string;
  role?: string;
}

@Component({
  selector: 'app-panel-general',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalRegistrar, ModalDetalle],
  templateUrl: './panel-general.html',
})
export class PanelGeneral implements OnInit, OnDestroy {
  // ── Filtros ──
  filtros = {
    receivedById: '' as number | '',
    paymentType: '' as 1 | 2 | '',
    source: '' as 1 | 2 | '',       
    startDate: '',
    endDate: '',
  };

  // ── Chevrón animado de los selects ──
  meseroAbierto = false;
  tipoAbierto = false;
  origenAbierto = false;             

  // ── Estado de la vista ──
  estadoVista: VistaEstado = 'skeleton';
  propinas: any[] = [];
  resumen = { total: 0, totalEfectivo: 0, totalTarjeta: 0 };

  // ── Paginación ──
  currentPage = 1;
  pageSize = 7;
  totalRecords = 0;
  totalPages = 1;

  // ── Modales ──
  modalAbierto = false;
  modalDetalleAbierto = false;
  tipSeleccionadaId: number | null = null;
  propinaAEditar: any = null;

  // ── Listas auxiliares ──
  meseros: Mesero[] = [];

  // ── Control de concurrencia (opcional, evita requests duplicados) ──
  private filtroSub = new Subject<void>();
  private filtroSubRef?: Subscription;

  constructor(
    private tipsService: TipsService,
    private usersService: UsersService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.cargarMeseros();

    // Dispara búsqueda con debounce al cambiar filtros (opcional)
    this.filtroSubRef = this.filtroSub
      .pipe(debounceTime(250))
      .subscribe(() => {
        this.currentPage = 1;
        this.cargarPropinas();
      });

    this.cargarPropinas();
  }

  ngOnDestroy() {
    this.filtroSubRef?.unsubscribe();
  }

  // ═══════════════════════════════════════════════════════
  // CARGA DE DATOS
  // ═══════════════════════════════════════════════════════

  cargarMeseros() {
    this.usersService.getUsers().subscribe({
      next: (users: any[]) => {
        this.meseros = users
          .filter((u) => u.role === 'mesero' || u.role === 'gerente')
          .map((u) => ({ id: u.id, name: u.name, role: u.role }));
        this.cdr.detectChanges();
      },
      error: () => {
        this.meseros = [];
      },
    });
  }

  cargarPropinas() {
    this.estadoVista = 'skeleton';
    this.cdr.detectChanges();

    this.tipsService
      .findAll({
        receivedById: this.filtros.receivedById || undefined,
        paymentType: this.filtros.paymentType || undefined,
        source: this.filtros.source || undefined,     
        startDate: this.filtros.startDate || undefined,
        endDate: this.filtros.endDate || undefined,
        tzOffsetMin: -new Date().getTimezoneOffset(),
        page: this.currentPage,
        limit: this.pageSize,
      })
      .subscribe({
        next: (response: TipListResponse) => {
          this.propinas = response.data;
          this.totalRecords = response.meta.totalRecords;
          this.totalPages = response.meta.totalPages;
          this.resumen = response.summary;
          this.estadoVista = response.data.length === 0 ? 'empty' : 'data';
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error al cargar propinas', err);
          this.propinas = [];
          this.totalRecords = 0;
          this.totalPages = 1;
          this.resumen = { total: 0, totalEfectivo: 0, totalTarjeta: 0 };
          this.estadoVista = 'empty';
          this.cdr.detectChanges();
        },
      });
  }

  // ═══════════════════════════════════════════════════════
  // FILTROS
  // ═══════════════════════════════════════════════════════

  aplicarFiltros() {
    this.currentPage = 1;
    this.cargarPropinas();
  }

  limpiarFiltros() {
    this.filtros = {
      receivedById: '',
      paymentType: '',
      source: '',           // 🆕
      startDate: '',
      endDate: '',
    };
    this.currentPage = 1;
    this.cargarPropinas();
  }

  get textoFiltrosActivos(): string {
    const partes: string[] = [];

    if (this.filtros.receivedById) {
      const mesero = this.meseros.find(
        (m) => m.id === Number(this.filtros.receivedById),
      );
      if (mesero) partes.push(`Mesero: ${mesero.name}`);
    }

    if (this.filtros.paymentType) {
      const tipo =
        Number(this.filtros.paymentType) === 1 ? 'Efectivo' : 'Tarjeta';
      partes.push(`Tipo: ${tipo}`);
    }

    if (this.filtros.source) {                          // 🆕
      const origen =
        Number(this.filtros.source) === 1 ? 'Mesa' : 'Pedido';
      partes.push(`Origen: ${origen}`);
    }

    if (this.filtros.startDate) {
      partes.push(`Desde: ${this.filtros.startDate}`);
    }
    if (this.filtros.endDate) {
      partes.push(`Hasta: ${this.filtros.endDate}`);
    }

    return partes.join(' · ');
  }

  // ═══════════════════════════════════════════════════════
  // PAGINACIÓN
  // ═══════════════════════════════════════════════════════

  cambiarPaginaAnterior() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cargarPropinas();
    }
  }

  cambiarPaginaSiguiente() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.cargarPropinas();
    }
  }

  cambiarTamanoPagina(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.pageSize = Number(target.value);
    this.currentPage = 1;
    this.cargarPropinas();
  }

  get totalPagesList(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  get Math() {
    return Math;
  }

  // ═══════════════════════════════════════════════════════
  // MODALES
  // ═══════════════════════════════════════════════════════

  abrirModalRegistro() {
    this.propinaAEditar = null;
    this.modalAbierto = true;
  }

  abrirModalEditar(propina: any) {
    this.propinaAEditar = propina;
    this.modalAbierto = true;
  }

  abrirModalDetalle(id: number) {
    this.tipSeleccionadaId = id;
    this.modalDetalleAbierto = true;
  }

  cerrarModal() {
    this.modalAbierto = false;
    this.propinaAEditar = null;
  }

  cerrarModalDetalle() {
    this.modalDetalleAbierto = false;
    this.tipSeleccionadaId = null;
  }

  onPropinaGuardada() {
    this.cerrarModal();
    this.cargarPropinas();
  }
}