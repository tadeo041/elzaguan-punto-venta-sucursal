import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TipsService } from '../../../../services/tips';

@Component({
  selector: 'app-modal-detalle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-detalle.html',
})
export class ModalDetalle implements OnInit {
  @Input() tipId!: number;
  @Output() cerrar = new EventEmitter<void>();

  detalle: any = null;
  historial: any[] = [];
  loading = true;

  /** Controla la animación de entrada/salida del panel lateral */
  visible = true; // arranca visible para disparar la animación de entrada

  Math = Math;

  constructor(private tipsService: TipsService) {}

  ngOnInit() {
    this.cargarDetalle();
  }

  cargarDetalle() {
    this.tipsService.getTipDetails(this.tipId).subscribe({
      next: (res) => {
        this.detalle = res.tip;
        // Ordenamos para que el más reciente quede arriba
        this.historial = res.history.sort((a: any, b: any) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error al cargar detalle', err);
        this.loading = false;
      }
    });
  }

  /** Cierra el modal solo si el clic fue directamente en el fondo oscuro */
  cerrarAlFondo(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.cerrarModal();
    }
  }

  cerrarModal() {
    this.visible = false; // Deslizamos hacia afuera
    setTimeout(() => {
      this.cerrar.emit(); // Avisamos al padre que se cierre
    }, 300); // Esperamos a que termine la animación
  }
}