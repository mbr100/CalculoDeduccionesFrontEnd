import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario, UsuarioDTO } from '../models/usuario';
import { PaginacionResponse } from '../models/paginacion-response';

/**
 * Servicio para gestión de usuarios
 */
@Injectable({
  providedIn: 'root'
})
export class UsuarioService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  private apiRoute = '/api/usuarios';

  /**
   * Obtener listado de usuarios con paginación
   */
  getUsuarios(page: number = 0, size: number = 10): Observable<PaginacionResponse<Usuario>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginacionResponse<Usuario>>(
      `${this.baseUrl}${this.apiRoute}`,
      { params, headers: this.getHeaders() }
    );
  }

  /**
   * Obtener usuario por ID
   */
  getUsuarioById(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(
      `${this.baseUrl}${this.apiRoute}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Crear nuevo usuario
   */
  createUsuario(usuario: UsuarioDTO): Observable<Usuario> {
    return this.http.post<Usuario>(
      `${this.baseUrl}${this.apiRoute}`,
      usuario,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Actualizar usuario existente
   */
  updateUsuario(id: number, usuario: UsuarioDTO): Observable<Usuario> {
    return this.http.put<Usuario>(
      `${this.baseUrl}${this.apiRoute}/${id}`,
      usuario,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Eliminar usuario
   */
  deleteUsuario(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl}${this.apiRoute}/${id}`,
      { headers: this.getHeaders() }
    );
  }

  /**
   * Activar/Desactivar usuario
   */
  toggleUsuarioStatus(id: number, activo: boolean): Observable<Usuario> {
    return this.http.patch<Usuario>(
      `${this.baseUrl}${this.apiRoute}/${id}/status`,
      { activo },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Cambiar contraseña de usuario
   */
  changePassword(id: number, oldPassword: string, newPassword: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}${this.apiRoute}/${id}/change-password`,
      { oldPassword, newPassword },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Resetear contraseña de usuario (solo admin)
   */
  resetPassword(id: number, newPassword: string): Observable<void> {
    return this.http.post<void>(
      `${this.baseUrl}${this.apiRoute}/${id}/reset-password`,
      { newPassword },
      { headers: this.getHeaders() }
    );
  }

  /**
   * Buscar usuarios por criterio
   */
  searchUsuarios(
    searchTerm: string,
    page: number = 0,
    size: number = 10
  ): Observable<PaginacionResponse<Usuario>> {
    const params = new HttpParams()
      .set('search', searchTerm)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaginacionResponse<Usuario>>(
      `${this.baseUrl}${this.apiRoute}/search`,
      { params, headers: this.getHeaders() }
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
