import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsersService, User, UserRole } from '../../services/users';
import { ModalUsuario } from './modal-usuario/modal-usuario';
import { ModalEstadoUsuario } from './modal-estado-usuario/modal-estado-usuario';

@Component({
    selector: 'app-usuarios',
    standalone: true,
    imports: [CommonModule, FormsModule, ModalUsuario, ModalEstadoUsuario],
    templateUrl: './usuarios.html',
})
export class Usuarios implements OnInit {
    estadoVista: 'skeleton' | 'data' | 'empty' = 'skeleton';

    filtros: {
        role: UserRole | '';
        isActive: 'true' | 'false' | '';
    } = {
            role: '',
            isActive: '',
        };

    textoFiltrosActivos = '';

    // Todos los usuarios filtrados (sin paginar)
    usuarios: User[] = [];
    // Usuarios de la página actual
    usuariosPagina: User[] = [];

    // Paginación client-side
    currentPage = 1;
    pageSize = 7;
    totalRecords = 0;
    Math = Math;

    // Selects abiertos (para chevron animado)
    rolAbierto = false;
    estadoAbierto = false;

    // Modales
    modalAbierto = false;
    usuarioAEditar: User | null = null;

    // Modal de activar/desactivar
    modalEstadoAbierto = false;
    usuarioAEstado: User | null = null;

    constructor(private usersService: UsersService) { }

    ngOnInit() {
        this.cargarUsuarios();
    }

    cargarUsuarios() {
        this.estadoVista = 'skeleton';
        this.actualizarTextoFiltros();

        this.usersService.getUsers(this.filtros).subscribe({
            next: (users) => {
                if (users.length === 0) {
                    this.usuarios = [];
                    this.usuariosPagina = [];
                    this.totalRecords = 0;
                    this.estadoVista = 'empty';
                } else {
                    this.usuarios = users;
                    this.totalRecords = users.length;
                    this.currentPage = 1;
                    this.actualizarPagina();
                    this.estadoVista = 'data';
                }
            },
            error: (err) => {
                console.error('Error al cargar usuarios', err);
                this.usuarios = [];
                this.usuariosPagina = [];
                this.totalRecords = 0;
                this.estadoVista = 'empty';
            },
        });
    }

    actualizarPagina() {
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        this.usuariosPagina = this.usuarios.slice(start, end);
    }

    get totalPages(): number {
        return Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
    }

    cambiarPaginaSiguiente() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.actualizarPagina();
        }
    }

    cambiarPaginaAnterior() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.actualizarPagina();
        }
    }

    cambiarTamanoPagina(event: Event) {
        const target = event.target as HTMLSelectElement;
        this.pageSize = Number(target.value);
        this.currentPage = 1;
        this.actualizarPagina();
    }

    actualizarTextoFiltros() {
        const textos: string[] = [];

        if (this.filtros.role) {
            const map: Record<string, string> = {
                gerente: 'Gerente',
                cajero: 'Cajero',
                mesero: 'Mesero',
                cocinero: 'Cocinero',
            };
            textos.push(`Rol: ${map[this.filtros.role]}`);
        }

        if (this.filtros.isActive !== '') {
            textos.push(this.filtros.isActive === 'true' ? 'Estado: Activos' : 'Estado: Inactivos');
        }

        this.textoFiltrosActivos = textos.join(' | ');
    }

    aplicarFiltros() {
        this.cargarUsuarios();
    }

    limpiarFiltros() {
        this.filtros = { role: '', isActive: '' };
        this.aplicarFiltros();
    }

    // Acciones
    abrirModalCrear() {
        this.usuarioAEditar = null;
        this.modalAbierto = true;
    }

    abrirModalEditar(usuario: User) {
        this.usuarioAEditar = usuario;
        this.modalAbierto = true;
    }

    cerrarModal() {
        this.modalAbierto = false;
        this.usuarioAEditar = null;
    }

    onUsuarioGuardado() {
        this.cerrarModal();
        this.cargarUsuarios();
    }

    // Abrir modal de activar/desactivar
    abrirModalEstado(usuario: User) {
        this.usuarioAEstado = usuario;
        this.modalEstadoAbierto = true;
    }

    cerrarModalEstado() {
        this.modalEstadoAbierto = false;
        this.usuarioAEstado = null;
    }

    onEstadoCambiado() {
        this.cerrarModalEstado();
        this.cargarUsuarios();
    }

    // Helpers de UI
    rolLabel(role: string): string {
        const map: Record<string, string> = {
            gerente: 'Gerente',
            cajero: 'Cajero',
            mesero: 'Mesero',
            cocinero: 'Cocinero',
        };
        return map[role] ?? role;
    }

    rolColor(role: string): string {
        const map: Record<string, string> = {
            gerente: 'bg-purple-100 text-purple-700',
            cajero: 'bg-blue-100 text-blue-700',
            mesero: 'bg-amber-100 text-amber-700',
            cocinero: 'bg-emerald-100 text-emerald-700',
        };
        return map[role] ?? 'bg-gray-100 text-gray-700';
    }
}