import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipsService } from '../../../../services/tips';

@Component({
  selector: 'app-modal-registrar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-registrar.html',
})
export class ModalRegistrar implements OnChanges {
  @Input() meseros: any[] = [];
  @Input() propinaAEditar: any = null;

  @Output() cerrar = new EventEmitter<void>();
  @Output() propinaGuardada = new EventEmitter<void>();

  esEdicion = false;

  nuevaPropina: {
    tableNumber: number | null;
    amount: number | null;
    paymentType: number;
    receivedById: number | string;
  } = {
    tableNumber: null,
    amount: null,
    paymentType: 1,
    receivedById: '',
  };

  isLoading = false;
  errorMessage = '';
  exitoMessage = '';

  // Controla el icono del chevron del select
  selectAbierto = false;

  constructor(private tipsService: TipsService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['propinaAEditar'] && changes['propinaAEditar'].currentValue) {
      this.esEdicion = true;
      const propina = changes['propinaAEditar'].currentValue;

      this.nuevaPropina = {
        tableNumber: propina.tableNumber,
        amount: Number(propina.amount),
        paymentType: propina.paymentType,
        receivedById: propina.receivedBy?.id ?? propina.receivedById ?? '',
      };
    } else {
      this.esEdicion = false;
      this.nuevaPropina = {
        tableNumber: null,
        amount: null,
        paymentType: 1,
        receivedById: '',
      };
    }
    // Limpiamos mensajes al abrir/cambiar
    this.errorMessage = '';
    this.exitoMessage = '';
  }

  guardar() {
    this.errorMessage = '';
    this.exitoMessage = '';

    if (!this.nuevaPropina.tableNumber || !this.nuevaPropina.amount || !this.nuevaPropina.receivedById) {
      this.errorMessage = 'Por favor, llena todos los campos obligatorios.';
      return;
    }

    this.isLoading = true;

    const payload = {
      tableNumber: Number(this.nuevaPropina.tableNumber),
      amount: Number(this.nuevaPropina.amount),
      paymentType: Number(this.nuevaPropina.paymentType),
      receivedById: Number(this.nuevaPropina.receivedById),
    };

    const peticion = this.esEdicion
      ? this.tipsService.updateTip(this.propinaAEditar.id, payload)
      : this.tipsService.createTip(payload);

    peticion.subscribe({
      next: () => {
        this.isLoading = false;
        // Mensaje verde de éxito
        this.exitoMessage = this.esEdicion
          ? '¡Propina actualizada correctamente!'
          : '¡Propina registrada correctamente!';

        // Pequeña espera para que el usuario vea el mensaje verde antes de cerrar
        setTimeout(() => {
          this.propinaGuardada.emit();
          this.cerrarModal();
        }, 900);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Error al guardar la propina.';
      },
    });
  }

  /** Cierra el modal solo si el clic fue directamente en el fondo oscuro */
  cerrarAlFondo(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      this.cerrarModal();
    }
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}