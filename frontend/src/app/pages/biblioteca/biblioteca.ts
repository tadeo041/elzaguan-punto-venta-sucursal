import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-biblioteca',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './biblioteca.html',
})
export class Biblioteca {
  documentos = [
    {
      titulo: 'Reglamento interior del trabajo',
      descripcion: 'Normas internas, lineamientos operativos y disposiciones aplicables al personal.',
      icono: 'reglamento',
      fecha: 'Hoy, 11:20 am',
      archivo: 'pdfs/pdf-reglamento-trabajo.pdf'
    },
  ];

  // --- Estado del toast ---
  toastVisible = false;
  toastMensaje = '';
  private toastTimer: any = null;

  descargarDocumento(url: string, nombreArchivo: string) {
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error('Error al descargar');
        return response.blob();
      })
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = nombreArchivo;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);

        // Mostrar toast de éxito
        this.mostrarToast(`"${nombreArchivo}" se descargó correctamente. Revisa tu carpeta de Descargas.`);
      })
      .catch(error => {
        console.error('Error en la descarga:', error);
        this.mostrarToast('No se pudo descargar el archivo. Intenta de nuevo.', true);
      });
  }

  private mostrarToast(mensaje: string, esError = false) {
    this.toastMensaje = mensaje;
    this.toastVisible = true;

    // Reiniciar el temporizador si ya había uno
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastVisible = false;
    }, 4500); // 4.5 segundos visible
  }

  cerrarToast() {
    this.toastVisible = false;
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }
}