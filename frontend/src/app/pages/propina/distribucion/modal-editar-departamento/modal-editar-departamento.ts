import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DepartmentsService } from '../../../../services/departments';

@Component({
  selector: 'app-modal-editar-departamento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal-editar-departamento.html',
})
export class ModalEditarDepartamento implements OnInit {
  @Input() departamento: any;
  @Output() cerrar = new EventEmitter<void>();
  @Output() guardado = new EventEmitter<void>();

  // Clonamos el objeto para no modificar la tabla hasta que se guarde
  edicion: any = {};
  isLoading = false;
  errorMessage = '';

  constructor(private departmentsService: DepartmentsService) {}

  ngOnInit() {
    // Copiamos los datos del departamento que recibimos
    this.edicion = { ...this.departamento };
  }

  guardar() {
    this.errorMessage = '';

    if (!this.edicion.name || !this.edicion.value || !this.edicion.workerCount) {
      this.errorMessage = 'Por favor, llena todos los campos obligatorios.';
      return;
    }

    this.isLoading = true;

    this.departmentsService.updateDepartment(this.edicion.id, this.edicion).subscribe({
      next: () => {
        this.isLoading = false;
        this.guardado.emit();
        this.cerrar.emit();
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error.message || 'Error al actualizar el departamento.';
      }
    });
  }

  cerrarModal() {
    this.cerrar.emit();
  }
}