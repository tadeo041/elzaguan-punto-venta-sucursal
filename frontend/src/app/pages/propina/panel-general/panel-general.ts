import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
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

interface Filtros {
  receivedById: number | '';
  paymentType: 1 | 2 | '';
  source: 1 | 2 | '';
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-panel-general',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalRegistrar, ModalDetalle],
  templateUrl: './panel-general.html',
})
export class PanelGeneral implements OnInit, OnDestroy {
  // ── Filtros que el usuario manipula en los controles ──
  filtros: Filtros = {
    receivedById: '',
    paymentType: '',
    source: '',
    startDate: this.hoyISO(),
    endDate: this.hoyISO(),
  };

  // ── Copia que SOLO se actualiza al pulsar Buscar/Limpiar ──
  // Es la que se envía al backend y la que alimenta "Filtros aplicados".
  filtrosAplicados: Filtros = { ...this.filtros };

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
  // HELPERS DE FECHA
  // ═══════════════════════════════════════════════════════

  /** Devuelve la fecha local de hoy en formato YYYY-MM-DD (apto para <input type="date">) */
  private hoyISO(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
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

    // ⚠️ Usamos filtrosAplicados (no filtros), así el backend recibe
    //    solo los filtros que el usuario confirmó con "Buscar".
    this.tipsService
      .findAll({
        receivedById: this.filtrosAplicados.receivedById || undefined,
        paymentType: this.filtrosAplicados.paymentType || undefined,
        source: this.filtrosAplicados.source || undefined,
        startDate: this.filtrosAplicados.startDate || undefined,
        endDate: this.filtrosAplicados.endDate || undefined,
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
    // Copiamos los filtros actuales a filtrosAplicados SOLO aquí.
    // A partir de este momento, "Filtros aplicados" y el backend
    // reflejan exactamente esta selección.
    this.filtrosAplicados = { ...this.filtros };
    this.currentPage = 1;
    this.cargarPropinas();
  }

  limpiarFiltros() {
    this.filtros = {
      receivedById: '',
      paymentType: '',
      source: '',
      startDate: this.hoyISO(),
      endDate: this.hoyISO(),
    };
    // También reseteamos la copia aplicada, para que "Filtros aplicados"
    // se vacíe visualmente y el backend reciba los valores por defecto.
    this.filtrosAplicados = { ...this.filtros };
    this.currentPage = 1;
    this.cargarPropinas();
  }

  /** Texto de filtros activos leído desde filtrosAplicados (no desde filtros) */
  get textoFiltrosActivos(): string {
    const partes: string[] = [];
    const f = this.filtrosAplicados;

    if (f.receivedById) {
      const mesero = this.meseros.find(
        (m) => m.id === Number(f.receivedById),
      );
      if (mesero) partes.push(`Recibido por: ${mesero.name}`);
    }

    if (f.source) {
      const origen = Number(f.source) === 1 ? 'Mesa' : 'Pedido';
      partes.push(`De dónde viene: ${origen}`);
    }

    if (f.paymentType) {
      const tipo = Number(f.paymentType) === 1 ? 'Efectivo' : 'Tarjeta';
      partes.push(`Tipo: ${tipo}`);
    }

    if (f.startDate) {
      partes.push(`Desde: ${f.startDate}`);
    }
    if (f.endDate) {
      partes.push(`Hasta: ${f.endDate}`);
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