import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-soporte',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './soporte.html',
})
export class Soporte {
  preguntaAbierta: string | null = null;

  togglePregunta(id: string) {
    this.preguntaAbierta = this.preguntaAbierta === id ? null : id;
  }
}