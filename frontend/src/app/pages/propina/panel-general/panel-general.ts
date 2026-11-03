import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Modales
import { ModalRegistrar } from './modal-registrar/modal-registrar';
// Servicios
import { TipsService } from '../../../services/tips'; 
import { UsersService } from '../../../services/users'; 

@Component({
  selector: 'app-panel-general',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalRegistrar], 
  templateUrl: './panel-general.html',
})
export class PanelGeneralComponent implements OnInit {
  estadoVista: 'skeleton' | 'data' | 'empty' = 'skeleton';

  // Filtros
  filtros = {
    waiterId: '',
    paymentType: '',
    startDate: '',
    endDate: ''
  };

  // Para mostrar el texto de filtros activos
  textoFiltrosActivos: string = '';

  // Datos que vienen de la API
  propinas: any[] = [];
  meseros: any[] = [];
  resumen = { total: 0, totalEfectivo: 0, totalTarjeta: 0 };

  // Paginación
  currentPage = 1;
  totalPages = 1;
  totalRecords = 0;
  pageSize = 7;
  Math = Math;

  // Estado de los modales
  modalAbierto = false;


  constructor(
    private tipsService: TipsService,
    private usersService: UsersService
  ) {}

  ngOnInit() {
    this.inicializarFechasPorDefecto();
    this.cargarMeseros();
    this.cargarPropinas();
  }

  // Establece el primer y último día del mes actual por defecto
  inicializarFechasPorDefecto() {
    const hoy = new Date();
    const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    // Formateamos a YYYY-MM-DD
    this.filtros.startDate = this.formatearFecha(primerDia);
    this.filtros.endDate = this.formatearFecha(ultimoDia);
    
    this.actualizarTextoFiltros();
  }

  // Función auxiliar para formatear fechas
  formatearFecha(fecha: Date): string {
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  }

  // Genera el texto de "Filtros activos"
  actualizarTextoFiltros() {
    let textos = [];

    if (this.filtros.startDate && this.filtros.endDate) {
      const inicio = new Date(this.filtros.startDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      const fin = new Date(this.filtros.endDate + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      textos.push(`Fecha: ${inicio} - ${fin}`);
    }

    if (this.filtros.paymentType) {
      const tipo = this.filtros.paymentType === '1' ? 'Efectivo' : 'Tarjeta';
      textos.push(`Tipo: ${tipo}`);
    }

    if (this.filtros.waiterId) {
      const mesero = this.meseros.find(m => m.id == this.filtros.waiterId);
      if (mesero) textos.push(`Mesero: ${mesero.name}`);
    }

    // Si no hay textos, devolvemos un string vacío
    this.textoFiltrosActivos = textos.length > 0 ? textos.join(' | ') : '';
  }

  cargarMeseros() {
    // Le pasamos el filtro isActive = 'true' a nuestra API
    this.usersService.getUsers({ isActive: 'true' }).subscribe({
      next: (users) => {
        // Filtramos por los roles permitidos para recibir propinas
        const rolesPermitidos = ['mesero', 'cajero', 'gerente'];
        this.meseros = users.filter(u => rolesPermitidos.includes(u.role));
        this.actualizarTextoFiltros();
      },
      error: (err) => console.error('Error al cargar meseros', err)
    });
  }

  cargarPropinas() {
    this.estadoVista = 'skeleton';
    this.actualizarTextoFiltros(); // Actualizamos el texto cada vez que se busca

    this.tipsService.getTips({
      ...this.filtros,
      page: this.currentPage,
      limit: this.pageSize
    }).subscribe({
      next: (response) => {
        this.resumen = response.summary;
        this.currentPage = response.meta.currentPage;
        this.totalPages = response.meta.totalPages;
        this.totalRecords = response.meta.totalRecords;

        if (response.data.length === 0) {
          this.propinas = [];
          this.estadoVista = 'empty';
        } else {
          this.propinas = response.data;
          this.estadoVista = 'data';
        }
      },
      error: (err) => {
        console.error('Error al cargar propinas', err);
        this.estadoVista = 'empty';
        this.resumen = { total: 0, totalEfectivo: 0, totalTarjeta: 0 };
        this.totalRecords = 0;
      }
    });
  }

  aplicarFiltros() {
    this.currentPage = 1;
    this.cargarPropinas();
  }

  limpiarFiltros() {
    this.filtros = { waiterId: '', paymentType: '', startDate: '', endDate: '' };
    this.aplicarFiltros();
  }

  cambiarPaginaSiguiente() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.cargarPropinas();
    }
  }

  cambiarPaginaAnterior() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cargarPropinas();
    }
  }

  cambiarTamanoPagina(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.pageSize = Number(target.value);
    this.currentPage = 1;
    this.cargarPropinas();
  }

  // Metodos de modales
  abrirModalRegistro() {
    this.modalAbierto = true;
  }

  onPropinaGuardada() {
    this.modalAbierto = false;
    this.cargarPropinas(); // Recarga la tabla y los totales
  }
  
  cerrarModal() {
    this.modalAbierto = false;
  }  
}