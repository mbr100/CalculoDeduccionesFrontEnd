import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Permiso } from '../models/usuario';
import { PaginacionResponse } from '../models/paginacion-response';

/**
 * Servicio para gestión de permisos
 */
@Injectable({
  providedIn: 'root'
})
export class PermisoService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private apiRoute = '/api/permisos';

  /**
   * Obtener listado de permisos con paginación
   */
  getPermisos(page: number = 0, size: number = 50): Observable<PaginacionResponse<Permiso>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginacionResponse<Permiso>>(
      `${this.baseUrl}${this.apiRoute}`,
      { params, headers: this.getHeaders() }
    );
  }

  /**
   * Obtener todos los permisos (sin paginación)
   */
  getAllPermisos(): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(
      `${this.baseUrl}${this.apiRoute}/all`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener permiso por ID
   */
  getPermisoById(id: number): Observable<Permiso> {
    return this.http.get<Permiso>(
      `${this.baseUrl}${this.apiRoute}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener permisos agrupados por recurso
   */
  getPermisosGroupedByResource(): Observable<{ [recurso: string]: Permiso[] }> {
    return this.http.get<{ [recurso: string]: Permiso[] }>(
      `${this.baseUrl}${this.apiRoute}/grouped`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener permisos por recurso específico
   */
  getPermisosByResource(recurso: string): Observable<Permiso[]> {
    return this.http.get<Permiso[]>(
      `${this.baseUrl}${this.apiRoute}/resource/${recurso}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener headers con token de autenticación
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}
