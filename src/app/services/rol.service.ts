import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Rol, RolDTO } from '../models/usuario';
import { PaginacionResponse } from '../models/paginacion-response';

/**
 * Servicio para gestión de roles
 */
@Injectable({
  providedIn: 'root'
})
export class RolService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private apiRoute = '/api/roles';

  /**
   * Obtener listado de roles con paginación
   */
  getRoles(page: number = 0, size: number = 10): Observable<PaginacionResponse<Rol>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginacionResponse<Rol>>(
      `${this.baseUrl}${this.apiRoute}`,
      { params, headers: this.getHeaders() }
    );
  }

  /**
   * Obtener todos los roles (sin paginación)
   */
  getAllRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(
      `${this.baseUrl}${this.apiRoute}/all`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener rol por ID
   */
  getRolById(id: number): Observable<Rol> {
    return this.http.get<Rol>(
      `${this.baseUrl}${this.apiRoute}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Crear nuevo rol
   */
  createRol(rol: RolDTO): Observable<Rol> {
    return this.http.post<Rol>(
      `${this.baseUrl}${this.apiRoute}`,
      rol,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Actualizar rol existente
   */
  updateRol(id: number, rol: RolDTO): Observable<Rol> {
    return this.http.put<Rol>(
      `${this.baseUrl}${this.apiRoute}/${id}`,
      rol,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Eliminar rol
   */
  deleteRol(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}${this.apiRoute}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Asignar permisos a un rol
   */
  assignPermissionsToRol(rolId: number, permisosIds: number[]): Observable<Rol> {
    return this.http.post<Rol>(
      `${this.baseUrl}${this.apiRoute}/${rolId}/permisos`,
      { permisosIds },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Obtener permisos de un rol
   */
  getRolPermissions(rolId: number): Observable<number[]> {
    return this.http.get<number[]>(
      `${this.baseUrl}${this.apiRoute}/${rolId}/permisos`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Activar/Desactivar rol
   */
  toggleRolStatus(id: number, activo: boolean): Observable<Rol> {
    return this.http.patch<Rol>(
      `${this.baseUrl}${this.apiRoute}/${id}/status`,
      { activo },
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
