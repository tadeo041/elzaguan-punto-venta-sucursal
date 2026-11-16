import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router'; // <-- IMPORTANTE

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule], // <-- Lo agregamos aquí
  templateUrl: './dashboard.html',
})
export class Dashboard {

}