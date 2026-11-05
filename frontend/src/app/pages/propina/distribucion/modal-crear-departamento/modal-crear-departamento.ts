import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepartmentsService } from '../../../../services/departments';

@Component({
  selector: 'app-modal-crear-departamento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-crear-departamento.html',
})
export class ModalCrearDepartamento {
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<void>();

  // Modelo con los campos que pide el backend
  nuevoDepartamento = {
    name: '',
    type: 'porcentaje',
    value: null as number | null,
    workerCount: null as number | null,
    icon: 'mesero'
  };

  isLoading = false;
  errorMessage = '';

  constructor(private departmentsService: DepartmentsService) {}

  guardar() {
    this.errorMessage = '';

    // Validación de campos obligatorios
    if (!this.nuevoDepartamento.name || !this.nuevoDepartamento.value || !this.nuevoDepartamento.workerCount) {
      this.errorMessage = 'Por favor, llena todos los campos obligatorios.';
      return;
    }

    this.isLoading = true;

    this.departmentsService.createDepartment(this.nuevoDepartamento).subscribe({
      next: () => {
        this.isLoading = false;
        this.guardado.emit(); // Avisamos al padre para que recargue la tabla
        this.cerrar.emit();   // Cerramos el modal
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error.message || 'Error al crear el departamento.';
      }
    });
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}