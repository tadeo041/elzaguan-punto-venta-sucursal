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
    waiterId: number | string; 
  } = {
    tableNumber: null,
    amount: null,
    paymentType: 1,
    waiterId: ''
  };

  isLoading = false;
  errorMessage = '';

  constructor(private tipsService: TipsService) {}

  // Usamos ngOnChanges para reaccionar cuando el padre nos pasa la propina
  ngOnChanges(changes: SimpleChanges) {
    if (changes['propinaAEditar'] && changes['propinaAEditar'].currentValue) {
      this.esEdicion = true;
      const propina = changes['propinaAEditar'].currentValue;
      
      this.nuevaPropina = {
        tableNumber: propina.tableNumber,
        amount: Number(propina.amount),
        paymentType: propina.paymentType,
        waiterId: propina.waiter.id
      };
    } else {
      // Si no nos pasan propina, es modo creación (limpiamos el formulario)
      this.esEdicion = false;
      this.nuevaPropina = {
        tableNumber: null,
        amount: null,
        paymentType: 1,
        waiterId: ''
      };
    }
  }

  guardar() {
    this.errorMessage = '';

    if (!this.nuevaPropina.tableNumber || !this.nuevaPropina.amount || !this.nuevaPropina.waiterId) {
      this.errorMessage = 'Por favor, llena todos los campos obligatorios.';
      return;
    }

    this.isLoading = true;

    const payload = {
      tableNumber: Number(this.nuevaPropina.tableNumber),
      amount: Number(this.nuevaPropina.amount),
      paymentType: Number(this.nuevaPropina.paymentType),
      waiterId: Number(this.nuevaPropina.waiterId)
    };

    const peticion = this.esEdicion 
      ? this.tipsService.updateTip(this.propinaAEditar.id, payload)
      : this.tipsService.createTip(payload);

    peticion.subscribe({
      next: () => {
        this.isLoading = false;
        this.propinaGuardada.emit(); 
        this.cerrarModal(); 
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error.message || 'Error al guardar la propina.';
      }
    });
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}