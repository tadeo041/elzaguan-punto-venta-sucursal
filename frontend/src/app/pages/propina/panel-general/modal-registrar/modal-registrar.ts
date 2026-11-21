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

  // Límites de validación
  readonly MESA_MIN = 1;
  readonly MESA_MAX = 30;
  readonly PROPINA_MIN = 0.01;
  readonly PROPINA_MAX = 1000;

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

  /** Bloquea teclas no numéricas y signos negativos en el input de N° mesa */
  bloquearTeclasMesa(event: KeyboardEvent) {
    const teclasBloqueadas = ['e', 'E', '-', '+', '.', ','];
    if (teclasBloqueadas.includes(event.key)) {
      event.preventDefault();
    }
  }

  /** Bloquea teclas no numéricas y signos negativos en el input de Propina (permite decimales) */
  bloquearTeclasPropina(event: KeyboardEvent) {
    const teclasBloqueadas = ['e', 'E', '-', '+'];
    if (teclasBloqueadas.includes(event.key)) {
      event.preventDefault();
    }
  }

  /**
   * Sanitiza el valor del campo indicado:
   * - Mesa: entero entre MESA_MIN y MESA_MAX.
   * - Propina: monto entre PROPINA_MIN y PROPINA_MAX (permite decimales).
   * Si el valor queda fuera de rango o inválido => lo deja en null.
   */
  sanitizarNumeroPositivo(campo: 'tableNumber' | 'amount', permitirDecimales = false) {
    const valor: unknown = this.nuevaPropina[campo];

    // Vacío o nulo => null
    if (valor === null || valor === undefined || valor === '') {
      this.nuevaPropina[campo] = null;
      return;
    }

    const num = Number(valor);

    // No es número => null
    if (isNaN(num)) {
      this.nuevaPropina[campo] = null;
      return;
    }

    if (!permitirDecimales) {
      // Mesa: entero y dentro de rango
      if (!Number.isInteger(num) || num < this.MESA_MIN || num > this.MESA_MAX) {
        this.nuevaPropina[campo] = null;
        return;
      }
      this.nuevaPropina[campo] = num;
    } else {
      // Propina: dentro de rango, permite decimales
      if (num < this.PROPINA_MIN || num > this.PROPINA_MAX) {
        this.nuevaPropina[campo] = null;
        return;
      }
      this.nuevaPropina[campo] = num;
    }
  }

  guardar() {
    this.errorMessage = '';
    this.exitoMessage = '';

    const mesa = Number(this.nuevaPropina.tableNumber);
    const monto = Number(this.nuevaPropina.amount);

    // Validación: N° mesa entero entre MESA_MIN y MESA_MAX
    if (
      this.nuevaPropina.tableNumber === null ||
      this.nuevaPropina.tableNumber === undefined ||
      isNaN(mesa) ||
      !Number.isInteger(mesa) ||
      mesa < this.MESA_MIN ||
      mesa > this.MESA_MAX
    ) {
      this.errorMessage = `El número de mesa debe ser un entero entre ${this.MESA_MIN} y ${this.MESA_MAX}.`;
      return;
    }

    // Validación: Propina monto entre PROPINA_MIN y PROPINA_MAX
    if (
      this.nuevaPropina.amount === null ||
      this.nuevaPropina.amount === undefined ||
      isNaN(monto) ||
      monto < this.PROPINA_MIN ||
      monto > this.PROPINA_MAX
    ) {
      this.errorMessage = `La propina debe ser un monto entre ${this.PROPINA_MIN} y ${this.PROPINA_MAX}.`;
      return;
    }

    // Validación: trabajador seleccionado
    if (!this.nuevaPropina.receivedById) {
      this.errorMessage = 'Por favor, selecciona quién recibió la propina.';
      return;
    }

    this.isLoading = true;

    const payload = {
      tableNumber: mesa,
      amount: monto,
      paymentType: Number(this.nuevaPropina.paymentType),
      receivedById: Number(this.nuevaPropina.receivedById),
    };

    const peticion = this.esEdicion
      ? this.tipsService.updateTip(this.propinaAEditar.id, payload)
      : this.tipsService.createTip(payload);

    peticion.subscribe({
      next: () => {
        this.isLoading = false;
        this.exitoMessage = this.esEdicion
          ? '¡Propina actualizada correctamente!'
          : '¡Propina registrada correctamente!';

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