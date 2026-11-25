import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipsService } from '../../../../services/tips';

type TipSource = 1 | 2;

@Component({
  selector: 'app-modal-registrar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-registrar.html',
})
export class ModalRegistrar implements OnChanges, AfterViewInit {
  @Input() meseros: any[] = [];
  @Input() propinaAEditar: any = null;

  @Output() cerrar = new EventEmitter<void>();
  @Output() propinaGuardada = new EventEmitter<void>();

  /** Referencia al body scrolleable del modal (para enfocar al abrir y navegar) */
  @ViewChild('modalBody') modalBody!: ElementRef<HTMLElement>;

  esEdicion = false;

  // Límites de validación
  readonly MESA_MIN = 1;
  readonly MESA_MAX = 30;
  readonly PROPINA_MIN = 0;
  readonly PROPINA_MAX = 1000;

  nuevaPropina: {
    source: TipSource;
    tableNumber: number | null;
    amount: number | null;
    paymentType: number;
    receivedById: number | string;
  } = {
    source: 1,
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

  /**
   * Flag que se activa cuando el usuario presiona Enter sobre el <select>.
   * Se usa para saber si el `change` posterior vino de teclado y así avanzar
   * el foco automáticamente al siguiente campo.
   */
  private enterPresionadoEnSelect = false;

  constructor(private tipsService: TipsService) {}

  ngAfterViewInit() {
    // Enfoca el primer campo al abrir el modal para que Enter funcione
    // sin necesidad de hacer clic dentro del modal.
    this.enfocarPrimerElemento();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['propinaAEditar'] && changes['propinaAEditar'].currentValue) {
      this.esEdicion = true;
      const propina = changes['propinaAEditar'].currentValue;

      this.nuevaPropina = {
        source: (propina.source as TipSource) ?? 1,
        tableNumber: propina.tableNumber ?? null,
        amount: Number(propina.amount),
        paymentType: propina.paymentType,
        receivedById: propina.receivedBy?.id ?? propina.receivedById ?? '',
      };
    } else {
      this.esEdicion = false;
      this.nuevaPropina = {
        source: 1,
        tableNumber: null,
        amount: null,
        paymentType: 1,
        receivedById: '',
      };
    }

    // Limpiamos mensajes al abrir/cambiar
    this.errorMessage = '';
    this.exitoMessage = '';

    // Si el componente se reutiliza sin destruirse, re-enfocamos al abrir.
    // El setTimeout deja que Angular renderice el @if de los inputs condicionales.
    setTimeout(() => this.enfocarPrimerElemento(), 0);
  }

  // Navegación con Enter

  /** Enfoca el primer campo focusable del body del modal. */
  private enfocarPrimerElemento() {
    const contenedor = this.modalBody?.nativeElement;
    if (!contenedor) return;

    const primero = contenedor.querySelector<HTMLElement>(
      'input:not([disabled]), select:not([disabled])'
    );
    if (primero) {
      primero.focus();
      if (primero instanceof HTMLInputElement && primero.type === 'number') {
        primero.select();
      }
    }
  }

  /** Devuelve la lista de elementos focusables visibles dentro del body. */
  private obtenerFocusables(desde: HTMLElement): HTMLElement[] {
    const contenedor = desde.closest('.overflow-y-auto') as HTMLElement | null;
    if (!contenedor) return [];

    return Array.from(
      contenedor.querySelectorAll<HTMLElement>(
        'input:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => el.offsetParent !== null && !el.hasAttribute('hidden'));
  }

  /** Mueve el foco al siguiente focusable; si es el último, dispara guardar(). */
  private moverFocoAlSiguiente(desde: HTMLElement) {
    const focusables = this.obtenerFocusables(desde);
    const idx = focusables.indexOf(desde);
    if (idx === -1) return;

    const siguiente = focusables[idx + 1];

    if (siguiente) {
      siguiente.focus();
      // En inputs numéricos, seleccionar el contenido para escribir encima
      if (siguiente instanceof HTMLInputElement && siguiente.type === 'number') {
        siguiente.select();
      }
    } else {
      // Último focusable => guardar
      this.guardar();
    }
  }

  /**
   * Navegación con Enter en el modal:
   * - Enter en cualquier campo => foco al siguiente focusable visible.
   * - Enter en el último campo => dispara guardar().
   * - El <select> se maneja aparte con onSelectKeydown/onSelectChange.
   */
  avanzarConEnter(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;

    const target = event.target as HTMLElement;

    // El <select> tiene su propio flujo (ver onSelectKeydown/onSelectChange)
    if (target.tagName === 'SELECT') return;

    event.preventDefault();
    this.moverFocoAlSiguiente(target);
  }

  /**
   * keydown del <select>:
   * - Enter => marcamos que el próximo change vino de teclado.
   *   NO hacemos preventDefault para dejar que el navegador confirme la opción.
   */
  onSelectKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      this.enterPresionadoEnSelect = true;
    }
  }

  /**
   * change del <select>:
   * - Si el cambio vino de Enter, avanzamos el foco al siguiente campo.
   * - Si vino de mouse, no movemos el foco (sería molesto).
   */
  onSelectChange(event: Event) {
    this.errorMessage = '';

    if (this.enterPresionadoEnSelect) {
      this.enterPresionadoEnSelect = false;
      const select = event.target as HTMLElement;
      // setTimeout(0) para que el dropdown nativo termine de cerrarse
      // antes de mover el foco.
      setTimeout(() => this.moverFocoAlSiguiente(select), 0);
    }
  }

  // Validación / teclas


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

  // ---------------------------------------------------------------------------
  // Guardar / cerrar
  // ---------------------------------------------------------------------------

  guardar() {
    // Evita doble envío si ya hay una petición en curso
    if (this.isLoading) return;

    this.errorMessage = '';
    this.exitoMessage = '';

    const esMesa = this.nuevaPropina.source === 1;
    const monto = Number(this.nuevaPropina.amount);

    // Validación de N° mesa (solo si es Mesa)
    if (esMesa) {
      const mesa = Number(this.nuevaPropina.tableNumber);
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
    }

    // Validación de Propina
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

    // Validación de trabajador
    if (!this.nuevaPropina.receivedById) {
      this.errorMessage = 'Por favor, selecciona quién recibió la propina.';
      return;
    }

    this.isLoading = true;

    // Payload: tableNumber solo si es Mesa
    const payload: any = {
      source: this.nuevaPropina.source,
      amount: monto,
      paymentType: Number(this.nuevaPropina.paymentType),
      receivedById: Number(this.nuevaPropina.receivedById),
    };

    if (esMesa) {
      payload.tableNumber = Number(this.nuevaPropina.tableNumber);
    }

    const peticion = this.esEdicion
      ? this.tipsService.update(this.propinaAEditar.id, payload)
      : this.tipsService.create(payload);

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
      error: (err: any) => {
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