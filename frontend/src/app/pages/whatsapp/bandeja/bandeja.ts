import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatPanel } from './chat-panel/chat-panel';
import { WhatsappService } from '../../../services/whatsapp';

export interface Conversacion {
  id: number;
  nombre: string;
  telefono: string;
  initials: string;
  ultimoMensaje: string;
  ultimoMensajeOrigen: 'cliente' | 'bot' | 'humano' | null;
  fechaUltimo: string;
  noLeidos: number;
  estado: 'open' | 'pending' | 'closed';
  enLinea: boolean;
  botActivo: boolean;
}

@Component({
  selector: 'app-bandeja',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatPanel],
  templateUrl: './bandeja.html',
})
export class Bandeja implements OnInit, OnDestroy {
  estadoVista: 'skeleton' | 'data' | 'empty' = 'skeleton';

  filtros = { busqueda: '', estado: '', startDate: '', endDate: '' };
  textoFiltrosActivos = '';

  conversaciones: Conversacion[] = [];

  currentPage = 1;
  totalPages = 1;
  totalRecords = 0;
  pageSize = 7;
  Math = Math;

  stats = { activas: 0, pendientes: 0, cerradas: 0, botsActivos: 0 };

  chatPanelAbierto = false;
  conversacionSeleccionadaId: number | null = null;

  private refreshInterval: any = null;

  constructor(private whatsappService: WhatsappService) {}

  ngOnInit() {
    this.inicializarFechasPorDefecto();
    this.cargarConversaciones();
    this.iniciarAutoRefresh();
  }

  ngOnDestroy() {
    this.detenerAutoRefresh();
  }

  private iniciarAutoRefresh() {
    this.detenerAutoRefresh();
    this.refreshInterval = setInterval(() => {
      if (!this.chatPanelAbierto) {
        this.refrescarConversaciones();
      }
    }, 2000);
  }

  private detenerAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
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

    // 521XXXXXXXXXX (13 dígitos, formato WhatsApp México) -> quitar el 1
    if (limpio.startsWith('521') && limpio.length === 13) {
      limpio = '52' + limpio.substring(3);
    }

    // 52XXXXXXXXXX (12 dígitos) -> +52 LLL PPP AAAA
    if (limpio.startsWith('52') && limpio.length === 12) {
      const lada = limpio.substring(2, 5);
      const parte1 = limpio.substring(5, 8);
      const parte2 = limpio.substring(8, 12);
      return `+52 ${lada} ${parte1} ${parte2}`;
    }

    // 10 dígitos sueltos -> +52 LLL PPP AAAA
    if (limpio.length === 10) {
      const lada = limpio.substring(0, 3);
      const parte1 = limpio.substring(3, 6);
      const parte2 = limpio.substring(6, 10);
      return `+52 ${lada} ${parte1} ${parte2}`;
    }

    return telefono;
  }

  actualizarTextoFiltros() {
    const textos: string[] = [];
    if (this.filtros.startDate && this.filtros.endDate) {
      const inicio = new Date(this.filtros.startDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      const fin = new Date(this.filtros.endDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      textos.push(`Fecha: ${inicio} - ${fin}`);
    }
    if (this.filtros.estado) {
      const map: any = { open: 'Abiertas', pending: 'Pendientes', closed: 'Cerradas' };
      textos.push(`Estado: ${map[this.filtros.estado]}`);
    }
    if (this.filtros.busqueda) textos.push(`Búsqueda: "${this.filtros.busqueda}"`);
    this.textoFiltrosActivos = textos.join(' | ');
  }

  cargarConversaciones() {
    this.estadoVista = 'skeleton';
    this.actualizarTextoFiltros();
    this.pedirConversaciones();
  }

  private refrescarConversaciones() {
    this.pedirConversaciones();
  }

  private pedirConversaciones() {
    this.whatsappService.getConversaciones({
      search: this.filtros.busqueda || undefined,
      status: this.filtros.estado || undefined,
      startDate: this.filtros.startDate || undefined,
      endDate: this.filtros.endDate || undefined,
      page: this.currentPage,
      limit: this.pageSize,
    }).subscribe({
      next: (res: any) => {
        const mapped: Conversacion[] = res.data.map((c: any) => ({
          id: c.id,
          nombre: c.name || 'Sin nombre',
          telefono: c.phoneNumber,
          initials: (c.name || 'Cliente').substring(0, 2).toUpperCase(),
          ultimoMensaje: c.lastMessagePreview || 'Sin mensajes',
          ultimoMensajeOrigen: c.lastMessageOrigin ?? null,
          fechaUltimo: c.lastMessageAt || c.createdAt,
          noLeidos: c.unreadCount,
          estado: c.status,
          enLinea: false,
          botActivo: c.botActivo,
        }));

        this.conversaciones = mapped;
        this.totalRecords = res.total;
        this.totalPages = res.totalPages;
        this.currentPage = res.page;
        this.stats = {
          activas: res.stats.activas,
          pendientes: res.stats.pendientes,
          cerradas: res.stats.cerradas,
          botsActivos: res.stats.botsActivos,
        };
        this.estadoVista = mapped.length === 0 ? 'empty' : 'data';
      },
      error: (err) => {
        console.error('Error cargando conversaciones', err);
        if (this.estadoVista === 'skeleton') {
          this.estadoVista = 'empty';
        }
      }
    });
  }

  aplicarFiltros() { this.currentPage = 1; this.cargarConversaciones(); }

  limpiarFiltros() {
    this.filtros = { busqueda: '', estado: '', startDate: '', endDate: '' };
    this.inicializarFechasPorDefecto();
    this.aplicarFiltros();
  }

  cambiarPaginaSiguiente() { if (this.currentPage < this.totalPages) { this.currentPage++; this.cargarConversaciones(); } }
  cambiarPaginaAnterior() { if (this.currentPage > 1) { this.currentPage--; this.cargarConversaciones(); } }

  cambiarTamanoPagina(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.pageSize = Number(target.value);
    this.currentPage = 1;
    this.cargarConversaciones();
  }

  toggleBot(conv: Conversacion, event: Event) {
    event.stopPropagation();

    const estadoAnterior = conv.botActivo;
    conv.botActivo = !conv.botActivo;

    this.whatsappService.toggleBot(conv.id, conv.botActivo).subscribe({
      next: () => {
        this.stats.botsActivos = this.conversaciones.filter(c => c.botActivo).length;
      },
      error: (err) => {
        console.error('Error al cambiar estado del bot', err);
        conv.botActivo = estadoAnterior;
      }
    });
  }

  onBotCambiado(activo: boolean) {
    const conv = this.conversaciones.find(c => c.id === this.conversacionSeleccionadaId);
    if (conv) {
      conv.botActivo = activo;
      this.stats.botsActivos = this.conversaciones.filter(c => c.botActivo).length;
    }
  }

  abrirChat(conv: Conversacion) {
    this.conversacionSeleccionadaId = conv.id;
    conv.noLeidos = 0;
    this.chatPanelAbierto = true;
  }

  cerrarChatPanel() {
    this.chatPanelAbierto = false;
    this.conversacionSeleccionadaId = null;
    this.cargarConversaciones();
  }

  get conversacionSeleccionada(): Conversacion | undefined {
    return this.conversaciones.find(c => c.id === this.conversacionSeleccionadaId);
  }
}