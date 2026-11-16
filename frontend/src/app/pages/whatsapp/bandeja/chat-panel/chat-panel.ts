import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  OnDestroy,
  Output,
  ViewChild,
  ElementRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WhatsappService } from '../../../../services/whatsapp';

interface Mensaje {
  id: number;
  direccion: 'in' | 'out';
  origen: 'cliente' | 'humano' | 'bot';
  texto: string;
  fecha: string;
  estado?: 'sent' | 'delivered' | 'read' | 'failed';
  tipo?: 'text' | 'template';
}

interface Cliente {
  id: number;
  nombre: string;
  telefono: string;
  initials: string;
  enLinea: boolean;
  ventanaAbierta: boolean;
  estado: 'open' | 'pending' | 'closed';
}

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-panel.html',
})
export class ChatPanel implements OnInit, OnChanges, OnDestroy {
  @Input() conversacionId!: number;
  @Input() botActivo = false;
  @Output() cerrar = new EventEmitter<void>();
  @Output() botCambiado = new EventEmitter<boolean>();

  @ViewChild('chatScroll') chatScroll?: ElementRef<HTMLDivElement>;

  cliente: Cliente | null = null;
  mensajes: Mensaje[] = [];
  nuevoMensaje = '';
  loading = true;
  visible = false;

  private refreshInterval: any = null;
  private enviando = false;

  constructor(private whatsappService: WhatsappService) {}

  ngOnInit() {
    this.cargarChat();
    this.iniciarAutoRefresh();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['conversacionId'] && !changes['conversacionId'].firstChange) {
      this.cargarChat();
    }
  }

  ngOnDestroy() {
    this.detenerAutoRefresh();
  }

  get chatCerrado(): boolean {
    return this.cliente?.estado === 'closed';
  }

  private iniciarAutoRefresh() {
    this.detenerAutoRefresh();
    this.refreshInterval = setInterval(() => {
      if (!this.enviando) {
        this.refrescarMensajes();
      }
    }, 5000);
  }

  private detenerAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  cargarChat() {
    this.loading = true;
    this.whatsappService.getConversacion(this.conversacionId).subscribe({
      next: (res) => {
        const conv = res.conversation;
        const msgs = res.messages;

        this.cliente = {
          id: conv.id,
          nombre: conv.name || 'Cliente',
          telefono: conv.phoneNumber,
          initials: (conv.name || 'Cliente').substring(0, 2).toUpperCase(),
          enLinea: false,
          ventanaAbierta: conv.lastMessageAt
            ? (new Date().getTime() - new Date(conv.lastMessageAt).getTime()) < 24 * 3600000
            : true,
          estado: conv.status,
        };

        this.mensajes = msgs.map((m: any) => ({
          id: m.id,
          direccion: m.direction,
          origen: m.origin,
          texto: m.content,
          fecha: m.createdAt,
          estado: m.status,
          tipo: m.messageType
        }));

        this.loading = false;
        setTimeout(() => this.scrollAlFinal(), 50);
      },
      error: (err) => {
        console.error('Error cargando chat', err);
        this.loading = false;
      }
    });
  }

  private refrescarMensajes() {
    this.whatsappService.getConversacion(this.conversacionId).subscribe({
      next: (res) => {
        const msgs = res.messages;
        const mensajesNuevos: Mensaje[] = msgs.map((m: any) => ({
          id: m.id,
          direccion: m.direction,
          origen: m.origin,
          texto: m.content,
          fecha: m.createdAt,
          estado: m.status,
          tipo: m.messageType
        }));

        const huboCambios = mensajesNuevos.length !== this.mensajes.length;
        this.mensajes = mensajesNuevos;

        const conv = res.conversation;
        if (this.cliente) {
          this.cliente.ventanaAbierta = conv.lastMessageAt
            ? (new Date().getTime() - new Date(conv.lastMessageAt).getTime()) < 24 * 3600000
            : true;
          this.cliente.estado = conv.status;
        }

        if (huboCambios) {
          setTimeout(() => this.scrollAlFinal(), 50);
        }
      },
      error: (err) => {
        console.error('Error refrescando mensajes', err);
      }
    });
  }

  toggleBot() {
    const estadoAnterior = this.botActivo;
    this.botActivo = !this.botActivo;

    this.whatsappService.toggleBot(this.conversacionId, this.botActivo).subscribe({
      next: () => this.botCambiado.emit(this.botActivo),
      error: (err) => {
        console.error('Error al cambiar estado del bot', err);
        this.botActivo = estadoAnterior;
      }
    });
  }

  enviar() {
    if (!this.nuevoMensaje.trim() || this.enviando || this.chatCerrado) return;

    const texto = this.nuevoMensaje;
    this.nuevoMensaje = '';
    this.enviando = true;

    const msgTemporal: Mensaje = {
      id: Date.now(),
      direccion: 'out',
      origen: 'humano',
      texto: texto,
      fecha: new Date().toISOString(),
      estado: 'sent',
      tipo: 'text',
    };
    this.mensajes.push(msgTemporal);
    setTimeout(() => this.scrollAlFinal(), 50);

    this.whatsappService.enviarMensaje(this.conversacionId, texto).subscribe({
      next: (m) => {
        const index = this.mensajes.findIndex(x => x.id === msgTemporal.id);
        if (index !== -1) {
          this.mensajes[index].id = m.id;
          this.mensajes[index].estado = m.status;
        }
        this.enviando = false;
      },
      error: (err) => {
        console.error('Error al enviar mensaje', err);
        const index = this.mensajes.findIndex(x => x.id === msgTemporal.id);
        if (index !== -1) {
          this.mensajes[index].estado = 'failed';
        }
        this.enviando = false;
      }
    });
  }

  cerrarModal() {
    this.visible = false;
    this.detenerAutoRefresh();
    setTimeout(() => this.cerrar.emit(), 300);
  }

  private scrollAlFinal() {
    const el = this.chatScroll?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}