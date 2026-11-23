import {
  Component, EventEmitter, Input, OnInit, Output, ViewChild, ElementRef,
  OnChanges, SimpleChanges, HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Conversacion, ClasificacionChat, EstadoChat, EstadoPedido, HistorialModificacion,
} from '../bandeja';

interface Mensaje {
  id: number;
  direccion: 'in' | 'out';
  origen: 'cliente' | 'humano' | 'bot' | 'sucursal';
  sucursalOrigen?: string;
  usuarioOrigen?: string;
  texto: string;
  fecha: string;
  estadoEnvio?: 'enviando' | 'enviado' | 'leido';
}

interface GrupoMensajes {
  etiqueta: string;
  mensajes: Mensaje[];
}

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-panel.html',
})
export class ChatPanel implements OnInit, OnChanges {
  @Input() conversacionId!: number;
  @Input() botActivo = false;
  @Input() conversacion?: Conversacion;

  @Output() cerrar = new EventEmitter<void>();
  @Output() botCambiado = new EventEmitter<boolean>();
  @Output() estadoChatCambiado = new EventEmitter<EstadoChat>();
  @Output() estadoPedidoCambiado = new EventEmitter<EstadoPedido>();

  @ViewChild('chatScroll') chatScroll?: ElementRef<HTMLDivElement>;

  mensajes: Mensaje[] = [];
  nuevoMensaje = '';
  loading = true;

  ngOnInit() {
    this.cargarChat();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['conversacionId'] && !changes['conversacionId'].firstChange) {
      this.cargarChat();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.cerrarModal();
  }

  // ---- Getters ----
  get chatCerrado(): boolean {
    return this.conversacion?.estado === 'cerrado';
  }

  get historial(): HistorialModificacion[] {
    return this.conversacion?.historialModificaciones ?? [];
  }

  get esPedido(): boolean {
    return this.conversacion?.clasificacion === 'pedido';
  }

  get gruposMensajes(): GrupoMensajes[] {
    const grupos: GrupoMensajes[] = [];
    let etiquetaActual = '';
    for (const m of this.mensajes) {
      const etiqueta = this.etiquetaFecha(m.fecha);
      if (etiqueta !== etiquetaActual) {
        etiquetaActual = etiqueta;
        grupos.push({ etiqueta, mensajes: [] });
      }
      grupos[grupos.length - 1].mensajes.push(m);
    }
    return grupos;
  }

  // ---- Acciones ----
  cargarChat() {
    this.loading = true;
    setTimeout(() => {
      this.mensajes = this.getMockMensajes();
      this.loading = false;
      setTimeout(() => this.scrollAlFinal(), 50);
    }, 300);
  }

  toggleBot() {
    this.botActivo = !this.botActivo;
    this.botCambiado.emit(this.botActivo);
  }

  cambiarEstadoChat(nuevo: EstadoChat) {
    if (!this.conversacion || this.conversacion.estado === nuevo) return;
    this.estadoChatCambiado.emit(nuevo);
  }

  cambiarEstadoPedido(nuevo: EstadoPedido) {
    if (!this.conversacion || this.conversacion.estadoPedido === nuevo) return;
    this.estadoPedidoCambiado.emit(nuevo);
  }

  enviar() {
    if (!this.nuevoMensaje.trim() || this.chatCerrado) return;
    const texto = this.nuevoMensaje;
    this.nuevoMensaje = '';
    const id = Date.now();
    this.mensajes.push({
      id,
      direccion: 'out',
      origen: 'humano',
      texto,
      fecha: new Date().toISOString(),
      estadoEnvio: 'enviando',
    });
    setTimeout(() => {
      const m = this.mensajes.find(x => x.id === id);
      if (m) m.estadoEnvio = 'enviado';
      this.scrollAlFinal();
    }, 600);
    setTimeout(() => {
      const m = this.mensajes.find(x => x.id === id);
      if (m) m.estadoEnvio = 'leido';
    }, 1800);
  }

  cerrarModal() {
    this.cerrar.emit();
  }

  // ---- Helpers ----
  private scrollAlFinal() {
    const el = this.chatScroll?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }

  private etiquetaFecha(iso: string): string {
    const d = new Date(iso);
    const hoy = new Date();
    const ayer = new Date();
    ayer.setDate(hoy.getDate() - 1);
    const mismoDia = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    if (mismoDia(d, hoy)) return 'HOY';
    if (mismoDia(d, ayer)) return 'AYER';
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
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

  badgeClasificacion(c: ClasificacionChat): { label: string; clase: string } {
    switch (c) {
      case 'informativo': return { label: 'Informativo', clase: 'bg-blue-100 text-blue-700' };
      case 'reservacion': return { label: 'Reservación', clase: 'bg-purple-100 text-purple-700' };
      case 'pedido': return { label: 'Pedido', clase: 'bg-amber-100 text-amber-700' };
    }
  }

  badgeEstadoChat(e: EstadoChat): { label: string; clase: string } {
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

  private getMockMensajes(): Mensaje[] {
    const id = this.conversacionId;
    if (id === 1) {
      return [
        { id: 1, direccion: 'in', origen: 'cliente', texto: 'Hola, buenas tardes', fecha: new Date(Date.now() - 30 * 60000).toISOString() },
        { id: 2, direccion: 'out', origen: 'bot', texto: '¡Hola! Bienvenido a El Zaguán. ¿En qué puedo ayudarte?', fecha: new Date(Date.now() - 29 * 60000).toISOString() },
        { id: 3, direccion: 'in', origen: 'cliente', texto: 'Quisiera reservar una mesa para 6 personas el sábado', fecha: new Date(Date.now() - 28 * 60000).toISOString() },
        { id: 4, direccion: 'out', origen: 'bot', texto: '¡Claro! ¿A qué hora te gustaría la reservación?', fecha: new Date(Date.now() - 27 * 60000).toISOString() },
        { id: 5, direccion: 'in', origen: 'cliente', texto: 'A las 8 de la noche, por favor', fecha: new Date(Date.now() - 26 * 60000).toISOString() },
        { id: 6, direccion: 'out', origen: 'sucursal', sucursalOrigen: 'Sucursal Centro', usuarioOrigen: 'Laura Méndez', texto: 'Listo María, te apartamos a las 8 pm. ¡Te esperamos!', fecha: new Date(Date.now() - 25 * 60000).toISOString() },
        { id: 7, direccion: 'in', origen: 'cliente', texto: 'Perfecto, muchas gracias', fecha: new Date(Date.now() - 24 * 60000).toISOString() },
        { id: 8, direccion: 'in', origen: 'cliente', texto: '¿Tienen estacionamiento?', fecha: new Date(Date.now() - 5 * 60000).toISOString() },
      ];
    }
    return [
      { id: 1, direccion: 'in', origen: 'cliente', texto: 'Hola, una pregunta…', fecha: new Date(Date.now() - 10 * 60000).toISOString() },
      { id: 2, direccion: 'out', origen: 'bot', texto: '¡Hola! Con gusto te ayudo.', fecha: new Date(Date.now() - 9 * 60000).toISOString() },
    ];
  }
}