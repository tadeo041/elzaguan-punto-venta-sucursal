import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, User } from '../../../services/users';

@Component({
    selector: 'app-modal-usuario',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './modal-usuario.html',
})
export class ModalUsuario implements OnChanges {
    @Input() usuarioAEditar: User | null = null;
    @Output() cerrar = new EventEmitter<void>();
    @Output() usuarioGuardado = new EventEmitter<void>();

    esEdicion = false;
    isLoading = false;
    errorMessage = '';
    exitoMessage = '';

    // Formulario
    form: {
        name: string;
        username: string;
        password: string;
        role: 'administrador' | 'gerente' | 'mesero' | 'cocinero';
    } = {
            name: '',
            username: '',
            password: '',
            role: 'gerente',
        };

    mostrarPassword = false;

    constructor(private usersService: UsersService) { }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['usuarioAEditar'] && changes['usuarioAEditar'].currentValue) {
            const u = changes['usuarioAEditar'].currentValue as User;
            this.esEdicion = true;
            this.form = {
                name: u.name,
                username: u.username,
                password: '',
                role: u.role,
            };
        } else {
            this.esEdicion = false;
            this.form = {
                name: '',
                username: '',
                password: '',
                role: 'gerente',
            };
        }
        this.errorMessage = '';
        this.exitoMessage = '';
    }

    togglePassword() {
        this.mostrarPassword = !this.mostrarPassword;
    }

    guardar() {
        this.errorMessage = '';
        this.exitoMessage = '';

        // Validaciones
        if (!this.form.name || !this.form.username) {
            this.errorMessage = 'Nombre y usuario son obligatorios.';
            return;
        }

        if (!this.esEdicion && !this.form.password) {
            this.errorMessage = 'La contraseña es obligatoria para nuevos usuarios.';
            return;
        }

        if (this.form.password && this.form.password.length < 6) {
            this.errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
            return;
        }

        this.isLoading = true;

        const payload: any = {
            name: this.form.name,
            username: this.form.username,
            role: this.form.role,
        };

        if (this.form.password) {
            payload.password = this.form.password;
        }

        const peticion = this.esEdicion && this.usuarioAEditar
            ? this.usersService.updateUser(this.usuarioAEditar.id, payload)
            : this.usersService.createUser(payload);

        peticion.subscribe({
            next: () => {
                this.isLoading = false;
                this.exitoMessage = this.esEdicion
                    ? '¡Usuario actualizado correctamente!'
                    : '¡Usuario creado correctamente!';

                setTimeout(() => {
                    this.usuarioGuardado.emit();
                }, 900);
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.error?.message || 'Error al guardar el usuario.';
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