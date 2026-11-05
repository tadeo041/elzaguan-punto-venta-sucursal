import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DepartmentsService } from '../../../../services/departments';

@Component({
  selector: 'app-modal-eliminar-departamento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal-eliminar-departamento.html',
})
export class ModalEliminarDepartamento {
  @Input() departamento: any;
  @Output() cerrar = new EventEmitter<void>();
  @Output() eliminado = new EventEmitter<void>();

  isLoading = false;
  errorMessage = '';

  constructor(private departmentsService: DepartmentsService) {}

  confirmarEliminacion() {
    this.isLoading = true;
    this.errorMessage = '';

    this.departmentsService.deleteDepartment(this.departamento.id).subscribe({
      next: () => {
        this.isLoading = false;
        this.eliminado.emit(); // Avisamos al padre que se eliminó
        this.cerrar.emit();    // Cerramos el modal
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error.message || 'Error al eliminar el departamento.';
      }
    });
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}