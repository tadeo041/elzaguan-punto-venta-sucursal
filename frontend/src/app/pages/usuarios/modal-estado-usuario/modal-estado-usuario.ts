import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService, User } from '../../../services/users';

@Component({
    selector: 'app-modal-estado-usuario',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './modal-estado-usuario.html',
})
export class ModalEstadoUsuario {
    @Input() usuario!: User;
    @Output() cerrar = new EventEmitter<void>();
    @Output() estadoCambiado = new EventEmitter<void>();

    isLoading = false;
    errorMessage = '';

    constructor(private usersService: UsersService) { }

    confirmar() {
        if (!this.usuario) return;

        this.isLoading = true;
        this.errorMessage = '';

        this.usersService.toggleStatus(this.usuario.id).subscribe({
            next: () => {
                this.isLoading = false;
                this.estadoCambiado.emit();
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.error?.message || 'Error al cambiar el estado del usuario.';
            },
        });
    }

    cerrarAlFondo(event: MouseEvent) {
        if (event.target === event.currentTarget) {
            this.cerrarModal();
        }
    }

    cerrarModal() {
        this.cerrar.emit();
    }
}