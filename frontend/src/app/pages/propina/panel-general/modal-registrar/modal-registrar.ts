import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TipsService } from '../../../../services/tips'; 

@Component({
  selector: 'app-modal-registrar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-registrar.html',
})
export class ModalRegistrar {
  // Recibimos la lista de meseros desde el componente padre
  @Input() meseros: any[] = [];
  
  // Eventos para avisar al padre
  @Output() cerrar = new EventEmitter<void>();
  @Output() propinaGuardada = new EventEmitter<void>();

  // Modelo del formulario
  nuevaPropina = {
    tableNumber: null,
    amount: null,
    paymentType: 1, // 1 = Efectivo por defecto
    waiterId: ''
  };

  isLoading = false;
  errorMessage = '';

  constructor(private tipsService: TipsService) {}

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

    this.tipsService.createTip(payload).subscribe({
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