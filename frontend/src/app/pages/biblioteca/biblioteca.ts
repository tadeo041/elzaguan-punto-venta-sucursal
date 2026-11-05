import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './biblioteca.html',
})
export class Biblioteca {
  // Datos de las tarjetas (Mock)
  documentos = [
    {
      titulo: 'Recetarios',
      descripcion: 'Estandarización de recetas, ingredientes, gramajes, costos y procesos de cocina.',
      icono: 'recetario',
      fecha: 'Hoy, 11:20 am',
      archivo: 'recetario.pdf'
    },
    {
      titulo: 'Reglamentos',
      descripcion: 'Normas internas, lineamientos operativos y disposiciones aplicables al personal.',
      icono: 'reglamento',
      fecha: 'Hoy, 11:20 am',
      archivo: 'reglamento.pdf'
    },
    {
      titulo: 'Bitácoras',
      descripcion: 'Registros diarios de operación, incidencias, aperturas, cierres y seguimiento.',
      icono: 'bitacora',
      fecha: 'Hoy, 11:20 am',
      archivo: 'bitacora.pdf'
    },
    {
      titulo: 'Cronogramas',
      descripcion: 'Calendarios, programas de actividades y planificación de tareas del restaurante.',
      icono: 'cronograma',
      fecha: 'Hoy, 11:20 am',
      archivo: 'cronograma.pdf'
    },
    {
      titulo: 'Capacitación',
      descripcion: 'Materiales de formación, inducción y desarrollo para cada área del restaurante.',
      icono: 'capacitacion',
      fecha: 'Hoy, 11:20 am',
      archivo: 'capacitacion.pdf'
    },
    {
      titulo: 'Formatos',
      descripcion: 'Plantillas, formularios y documentos utilizados en los procesos operativos.',
      icono: 'formato',
      fecha: 'Hoy, 11:20 am',
      archivo: 'formato.pdf'
    },
    {
      titulo: 'Políticas',
      descripcion: 'Procedimientos estandarizados que garantizan una operación eficiente y segura.',
      icono: 'politica',
      fecha: 'Hoy, 11:20 am',
      archivo: 'politica.pdf'
    },
    {
      titulo: 'Procesos',
      descripcion: 'Procedimientos documentados para asegurar la calidad del servicio.',
      icono: 'proceso',
      fecha: 'Hoy, 11:20 am',
      archivo: 'proceso.pdf'
    }
  ];
}