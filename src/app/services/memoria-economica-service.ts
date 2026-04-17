import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MemoriaEconomicaService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/api/economicos`;

  descargarMemoriaEconomica(idEconomico: number): void {
    this.http.get(`${this.baseUrl}/${idEconomico}/memoria-economica`, {
      responseType: 'blob'
    }).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `memoria-economica-${idEconomico}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Error descargando la memoria económica', err);
      }
    });
  }
}
