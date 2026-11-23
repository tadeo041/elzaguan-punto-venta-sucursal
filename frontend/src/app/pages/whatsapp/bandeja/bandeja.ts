import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatPanel } from './chat-panel/chat-panel';

export type ClasificacionChat = 'informativo' | 'reservacion' | 'pedido';

export type TabActiva = 'todos' | 'informativo' | 'reservacion' | 'pedido';

export type EstadoChat = 'abierto' | 'pendiente' | 'cerrado';

export type EstadoPedido = 'pendiente' | 'entregado' | 'cancelado';

export interface Conversacion {
  id: number;
  nombre: string;
  telefono: string;
  initials: string;
  ultimoMensaje: string;
  ultimoMensajeOrigen: 'cliente' | 'bot' | 'humano' | 'sucursal';
  sucursalOrigen?: string;
  usuarioOrigen?: string;
  fechaUltimo: string;
  noLeidos: number;
  estado: EstadoChat;
  estadoPedido?: EstadoPedido;
  enLinea: boolean;
  botActivo: boolean;
  clasificacion: ClasificacionChat;
  sucursal: string;
  historialModificaciones: HistorialModificacion[];
}

export interface HistorialModificacion {
  fecha: string;
  usuario: string;
  sucursal: string;
  accion: string;
}

export interface TabConfig {
  id: TabActiva;
  label: string;
  count: number;
}

@Component({
  selector: 'app-bandeja',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatPanel],
  templateUrl: './bandeja.html',
})
export class Bandeja implements OnInit {
  estadoVista: 'skeleton' | 'data' | 'empty' = 'data';
  tabActiva: TabActiva = 'todos';

  filtros = {
    busqueda: '',
    startDate: '',
    endDate: '',
    estadoChat: '' as EstadoChat | '',
    estadoPedido: '' as EstadoPedido | '',
    sucursal: '',
  };
  textoFiltrosActivos = '';

  conversaciones: Conversacion[] = [];

  currentPage = 1;
  pageSize = 10;
  Math = Math;

  chatPanelAbierto = false;
  conversacionSeleccionadaId: number | null = null;

  ngOnInit() {
    this.inicializarFechasPorDefecto();
    this.cargarConversaciones();
  }

  inicializarFechasPorDefecto() {
    const hoy = new Date();
    const hace7 = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 7);
    this.filtros.startDate = this.formatearFecha(hace7);
    this.filtros.endDate = this.formatearFecha(hoy);
    this.actualizarTextoFiltros();
  }

  formatearFecha(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }

  formatearTelefono(telefono: string): string {
    if (!telefono) return '';
    let limpio = telefono.replace(/\D/g, '');
    if (limpio.startsWith('521') && limpio.length === 13) limpio = '52' + limpio.substring(3);
    if (limpio.startsWith('52') && limpio.length === 12) {
      return `+52 ${limpio.substring(2, 5)} ${limpio.substring(5, 8)} ${limpio.substring(8, 12)}`;
    }
    if (limpio.length === 10) {
      return `+52 ${limpio.substring(0, 3)} ${limpio.substring(3, 6)} ${limpio.substring(6, 10)}`;
    }
    return telefono;
  }

  actualizarTextoFiltros() {
    const textos: string[] = [];
    if (this.filtros.startDate && this.filtros.endDate) {
      const inicio = new Date(this.filtros.startDate + 'T00:00:00').toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
      const fin = new Date(this.filtros.endDate + 'T00:00:00').toLocaleDateString('es-ES', {
        day: '2-digit', month: 'short', year: 'numeric',
      });
      textos.push(`Fecha: ${inicio} - ${fin}`);
    }
    if (this.filtros.busqueda) textos.push(`Búsqueda: "${this.filtros.busqueda}"`);
    if (this.filtros.estadoChat) textos.push(`Estado chat: ${this.labelEstadoChat(this.filtros.estadoChat)}`);
    if (this.filtros.estadoPedido) textos.push(`Estado pedido: ${this.labelEstadoPedido(this.filtros.estadoPedido)}`);
    if (this.filtros.sucursal) textos.push(`Sucursal: ${this.filtros.sucursal}`);
    this.textoFiltrosActivos = textos.join(' | ');
  }

  cargarConversaciones() {
    this.estadoVista = 'skeleton';
    setTimeout(() => {
      this.conversaciones = this.getMockConversaciones();
      this.currentPage = 1;
      this.estadoVista = this.conversaciones.length === 0 ? 'empty' : 'data';
    }, 400);
  }

  get tabs(): TabConfig[] {
    return [
      { id: 'todos', label: 'Todos', count: this.conversaciones.length },
      { id: 'informativo', label: 'Información general', count: this.contarPorClasificacion('informativo') },
      { id: 'reservacion', label: 'Reservaciones', count: this.contarPorClasificacion('reservacion') },
      { id: 'pedido', label: 'Pedidos', count: this.contarPorClasificacion('pedido') },
    ];
  }

  get tituloTabActiva(): string {
    switch (this.tabActiva) {
      case 'todos': return 'Todas las conversaciones';
      case 'informativo': return 'Información general';
      case 'reservacion': return 'Reservaciones';
      case 'pedido': return 'Pedidos de comida';
    }
  }

  get parrafoTabActiva(): string {
    switch (this.tabActiva) {
      case 'todos':
        return 'Historial completo de mensajes recibidos, clasificados automáticamente por el chatbot.';
      case 'informativo':
        return 'Consultas generales sobre horarios, ubicación, menú y servicios. Visibles para todas las sucursales.';
      case 'reservacion':
        return 'Solicitudes de reservación atendidas por cada sucursal. Solo visibles para la sucursal correspondiente.';
      case 'pedido':
        return 'Pedidos de comida recibidos. Solo visibles para la sucursal donde se realizó el pedido.';
    }
  }

  contarPorClasificacion(c: ClasificacionChat): number {
    return this.conversaciones.filter(x => x.clasificacion === c && x.noLeidos > 0).length;
  }

  get sucursalesDisponibles(): string[] {
    const set = new Set(this.conversaciones.map(c => c.sucursal).filter(Boolean));
    return Array.from(set).sort();
  }

  get conversacionesFiltradas(): Conversacion[] {
    let lista = this.conversaciones;

    if (this.tabActiva !== 'todos') {
      lista = lista.filter(c => c.clasificacion === this.tabActiva);
    }
    if (this.filtros.busqueda) {
      const q = this.filtros.busqueda.toLowerCase();
      lista = lista.filter(c =>
        c.nombre.toLowerCase().includes(q) || c.telefono.includes(q)
      );
    }
    if (this.filtros.estadoChat) {
      lista = lista.filter(c => c.estado === this.filtros.estadoChat);
    }
    if (this.filtros.estadoPedido) {
      lista = lista.filter(c =>
        c.clasificacion === 'pedido' && c.estadoPedido === this.filtros.estadoPedido
      );
    }
    if (this.filtros.sucursal) {
      lista = lista.filter(c => c.sucursal === this.filtros.sucursal);
    }
    if (this.filtros.startDate && this.filtros.endDate) {
      const ini = new Date(this.filtros.startDate + 'T00:00:00').getTime();
      const fin = new Date(this.filtros.endDate + 'T23:59:59').getTime();
      lista = lista.filter(c => {
        const t = new Date(c.fechaUltimo).getTime();
        return t >= ini && t <= fin;
      });
    }
    return lista;
  }

  get conversacionesPagina(): Conversacion[] {
    const inicio = (this.currentPage - 1) * this.pageSize;
    return this.conversacionesFiltradas.slice(inicio, inicio + this.pageSize);
  }

  get totalRegistrosFiltrados(): number {
    return this.conversacionesFiltradas.length;
  }

  get totalPaginasFiltradas(): number {
    return Math.ceil(this.totalRegistrosFiltrados / this.pageSize) || 1;
  }

  get botsActivosCount(): number {
    return this.conversacionesFiltradas.filter(c => c.botActivo).length;
  }

  cambiarTab(tab: TabActiva) {
    this.tabActiva = tab;
    this.currentPage = 1;
  }

  aplicarFiltros() {
    this.currentPage = 1;
    this.actualizarTextoFiltros();
  }

  limpiarFiltros() {
    this.filtros = {
      busqueda: '',
      startDate: '',
      endDate: '',
      estadoChat: '',
      estadoPedido: '',
      sucursal: '',
    };
    this.inicializarFechasPorDefecto();
    this.currentPage = 1;
  }

  cambiarPaginaSiguiente() { if (this.currentPage < this.totalPaginasFiltradas) this.currentPage++; }
  cambiarPaginaAnterior() { if (this.currentPage > 1) this.currentPage--; }

  cambiarTamanoPagina(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.pageSize = Number(target.value);
    this.currentPage = 1;
  }

  toggleBot(conv: Conversacion, event: Event) {
    event.stopPropagation();
    conv.botActivo = !conv.botActivo;
    conv.historialModificaciones.unshift({
      fecha: new Date().toISOString(),
      usuario: 'Admin Zaguán',
      sucursal: conv.sucursal,
      accion: conv.botActivo ? 'Bot activado' : 'Bot desactivado',
    });
  }

  onBotCambiado(activo: boolean) {
    const conv = this.conversaciones.find(c => c.id === this.conversacionSeleccionadaId);
    if (conv) {
      conv.botActivo = activo;
      conv.historialModificaciones.unshift({
        fecha: new Date().toISOString(),
        usuario: 'Admin Zaguán',
        sucursal: conv.sucursal,
        accion: activo ? 'Bot activado' : 'Bot desactivado',
      });
    }
  }

  onEstadoChatCambiado(nuevo: EstadoChat) {
    const conv = this.conversaciones.find(c => c.id === this.conversacionSeleccionadaId);
    if (!conv || conv.estado === nuevo) return;
    const anterior = conv.estado;
    conv.estado = nuevo;
    conv.historialModificaciones.unshift({
      fecha: new Date().toISOString(),
      usuario: 'Admin Zaguán',
      sucursal: conv.sucursal,
      accion: `Estado: ${this.labelEstadoChat(anterior)} → ${this.labelEstadoChat(nuevo)}`,
    });
  }

  onEstadoPedidoCambiado(nuevo: EstadoPedido) {
    const conv = this.conversaciones.find(c => c.id === this.conversacionSeleccionadaId);
    if (!conv || conv.clasificacion !== 'pedido' || conv.estadoPedido === nuevo) return;
    const anterior = conv.estadoPedido;
    conv.estadoPedido = nuevo;
    conv.historialModificaciones.unshift({
      fecha: new Date().toISOString(),
      usuario: 'Admin Zaguán',
      sucursal: conv.sucursal,
      accion: `Pedido: ${anterior ? this.labelEstadoPedido(anterior) : '—'} → ${this.labelEstadoPedido(nuevo)}`,
    });
  }

  cambiarEstadoPedido(conv: Conversacion, nuevo: EstadoPedido) {
    if (conv.clasificacion !== 'pedido' || conv.estadoPedido === nuevo) return;
    const anterior = conv.estadoPedido;
    conv.estadoPedido = nuevo;
    conv.historialModificaciones.unshift({
      fecha: new Date().toISOString(),
      usuario: 'Admin Zaguán',
      sucursal: conv.sucursal,
      accion: `Pedido: ${anterior ? this.labelEstadoPedido(anterior) : '—'} → ${this.labelEstadoPedido(nuevo)}`,
    });
  }

  abrirChat(conv: Conversacion) {
    this.conversacionSeleccionadaId = conv.id;
    conv.noLeidos = 0;
    this.chatPanelAbierto = true;
  }

  cerrarChatPanel() {
    this.chatPanelAbierto = false;
    this.conversacionSeleccionadaId = null;
  }

  get conversacionSeleccionada(): Conversacion | undefined {
    return this.conversaciones.find(c => c.id === this.conversacionSeleccionadaId);
  }

  labelEstadoChat(e: EstadoChat): string {
    return { abierto: 'Abierto', pendiente: 'Pendiente', cerrado: 'Cerrado' }[e];
  }

  labelEstadoPedido(e: EstadoPedido): string {
    return { pendiente: 'Pendiente', entregado: 'Entregado', cancelado: 'Cancelado' }[e];
  }

  badgeClasificacion(c: ClasificacionChat): { label: string; clase: string } {
    switch (c) {
      case 'informativo': return { label: 'Informativo', clase: 'bg-blue-100 text-blue-700' };
      case 'reservacion': return { label: 'Reservación', clase: 'bg-purple-100 text-purple-700' };
      case 'pedido': return { label: 'Pedido', clase: 'bg-amber-100 text-amber-700' };
    }
  }

  badgeEstado(e: EstadoChat): { label: string; clase: string } {
    switch (e) {
      case 'abierto': return { label: 'Abierto', clase: 'bg-green-100 text-green-700' };
      case 'pendiente': return { label: 'Pendiente', clase: 'bg-yellow-100 text-yellow-800' };
      case 'cerrado': return { label: 'Cerrado', clase: 'bg-gray-100 text-gray-600' };
    }
  }

  badgeEstadoPedido(e: EstadoPedido): { label: string; clase: string } {
    switch (e) {
      case 'pendiente': return { label: 'Pendiente', clase: 'bg-orange-100 text-orange-700' };
      case 'entregado': return { label: 'Entregado', clase: 'bg-emerald-100 text-emerald-700' };
      case 'cancelado': return { label: 'Cancelado', clase: 'bg-red-100 text-red-700' };
    }
  }

  private getMockConversaciones(): Conversacion[] {
    return [
      {
        id: 1, nombre: 'María López', telefono: '5215512345678', initials: 'ML',
        ultimoMensaje: 'Quisiera reservar para 6 personas el sábado', ultimoMensajeOrigen: 'cliente',
        fechaUltimo: new Date(Date.now() - 5 * 60000).toISOString(),
        noLeidos: 2, estado: 'pendiente', enLinea: true, botActivo: true,
        clasificacion: 'reservacion', sucursal: 'Sucursal Centro',
        historialModificaciones: [
          { fecha: new Date(Date.now() - 10 * 60000).toISOString(), usuario: 'Admin Zaguán', sucursal: 'Sucursal Centro', accion: 'Bot activado' },
        ],
      },
      {
        id: 2, nombre: 'Carlos Ramírez', telefono: '5215598765432', initials: 'CR',
        ultimoMensaje: '¿Cuál es el horario del restaurante?', ultimoMensajeOrigen: 'cliente',
        fechaUltimo: new Date(Date.now() - 15 * 60000).toISOString(),
        noLeidos: 1, estado: 'abierto', enLinea: false, botActivo: true,
        clasificacion: 'informativo', sucursal: 'Todas',
        historialModificaciones: [],
      },
      {
        id: 3, nombre: 'Ana Torres', telefono: '5215544332211', initials: 'AT',
        ultimoMensaje: 'Quiero ordenar 3 tacos al pastor y 2 aguas', ultimoMensajeOrigen: 'cliente',
        fechaUltimo: new Date(Date.now() - 20 * 60000).toISOString(),
        noLeidos: 3, estado: 'pendiente', enLinea: true, botActivo: false,
        clasificacion: 'pedido', sucursal: 'Sucursal Sur',
        estadoPedido: 'pendiente',
        historialModificaciones: [
          { fecha: new Date(Date.now() - 25 * 60000).toISOString(), usuario: 'Laura Méndez', sucursal: 'Sucursal Sur', accion: 'Bot desactivado' },
        ],
      },
      {
        id: 4, nombre: 'Roberto Díaz', telefono: '5215522334455', initials: 'RD',
        ultimoMensaje: 'Perfecto, ya recibí mi pedido. ¡Gracias!', ultimoMensajeOrigen: 'cliente',
        fechaUltimo: new Date(Date.now() - 40 * 60000).toISOString(),
        noLeidos: 0, estado: 'cerrado', enLinea: false, botActivo: false,
        clasificacion: 'pedido', sucursal: 'Sucursal Centro',
        estadoPedido: 'entregado',
        historialModificaciones: [
          { fecha: new Date(Date.now() - 45 * 60000).toISOString(), usuario: 'Admin Zaguán', sucursal: 'Sucursal Centro', accion: 'Pedido: Pendiente → Entregado' },
        ],
      },
      {
        id: 5, nombre: 'Patricia Ruiz', telefono: '5215577889900', initials: 'PR',
        ultimoMensaje: 'Mejor cancelen el pedido, no podré pasar', ultimoMensajeOrigen: 'cliente',
        fechaUltimo: new Date(Date.now() - 50 * 60000).toISOString(),
        noLeidos: 0, estado: 'cerrado', enLinea: false, botActivo: false,
        clasificacion: 'pedido', sucursal: 'Sucursal Norte',
        estadoPedido: 'cancelado',
        historialModificaciones: [
          { fecha: new Date(Date.now() - 55 * 60000).toISOString(), usuario: 'Admin Zaguán', sucursal: 'Sucursal Norte', accion: 'Pedido: Pendiente → Cancelado' },
        ],
      },
      {
        id: 6, nombre: 'José Hernández', telefono: '5215566778899', initials: 'JH',
        ultimoMensaje: 'Gracias, ahí estaré el sábado a las 8', ultimoMensajeOrigen: 'cliente',
        fechaUltimo: new Date(Date.now() - 60 * 60000).toISOString(),
        noLeidos: 0, estado: 'abierto', enLinea: true, botActivo: true,
        clasificacion: 'reservacion', sucursal: 'Sucursal Norte',
        historialModificaciones: [
          { fecha: new Date(Date.now() - 2 * 3600000).toISOString(), usuario: 'Admin Zaguán', sucursal: 'Sucursal Norte', accion: 'Bot activado' },
        ],
      },
      {
        id: 7, nombre: 'Lucía Flores', telefono: '5215533445566', initials: 'LF',
        ultimoMensaje: '¿Tienen opciones vegetarianas?', ultimoMensajeOrigen: 'cliente',
        fechaUltimo: new Date(Date.now() - 90 * 60000).toISOString(),
        noLeidos: 0, estado: 'cerrado', enLinea: false, botActivo: false,
        clasificacion: 'informativo', sucursal: 'Todas',
        historialModificaciones: [],
      },
    ];
  }
}