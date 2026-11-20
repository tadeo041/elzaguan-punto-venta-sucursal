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
      titulo: 'Reglamento interior del trabajo',
      descripcion: 'Normas internas, lineamientos operativos y disposiciones aplicables al personal.',
      icono: 'reglamento',
      fecha: 'Hoy, 11:20 am',
      archivo: 'pdfs/pdf-reglamento-trabajo.pdf'
    },
  ];
}