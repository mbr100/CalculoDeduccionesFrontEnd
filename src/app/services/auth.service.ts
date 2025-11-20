import { Injectable, signal, WritableSignal, inject, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Usuario,
  LoginCredentials,
  AuthResponse,
  UserSession
} from '../models/usuario';

/**
 * Servicio de autenticación y gestión de sesión de usuario
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // URL base de la API
  private baseUrl = environment.apiUrl;

  // Claves para localStorage
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';
  private readonly PERMISSIONS_KEY = 'user_permissions';

  // Estado de autenticación reactivo
  public isAuthenticated: WritableSignal<boolean> = signal(false);
  public currentUser: WritableSignal<Usuario | null> = signal(null);
  public userPermissions: WritableSignal<string[]> = signal([]);
  public loading: WritableSignal<boolean> = signal(false);

  // Observable para componentes que prefieren observables
  private authStatusSubject = new BehaviorSubject<boolean>(false);
  public authStatus$ = this.authStatusSubject.asObservable();

  // Computed signal para verificar si el usuario es admin
  public isAdmin = computed(() => {
    const user = this.currentUser();
    return user?.rol?.nombre === 'Super Administrador' || user?.rol?.nombre === 'Administrador';
  });

  constructor() {
    // Restaurar sesión desde localStorage al iniciar
    this.restoreSession();
  }

  /**
   * Iniciar sesión
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    this.loading.set(true);

    return this.http.post<AuthResponse>(
      `${this.baseUrl}/api/auth/login`,
      credentials,
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
        this.loading.set(false);
      }),
      catchError(error => {
        this.loading.set(false);
        return throwError(() => error);
      })
    );
  }

  /**
   * Cerrar sesión
   */
  logout(): void {
    // Llamar al endpoint de logout en el backend (opcional)
    this.http.post(`${this.baseUrl}/api/auth/logout`, {}).subscribe({
      next: () => {
        this.clearSession();
        this.router.navigate(['/login']);
      },
      error: () => {
        // Incluso si falla, limpiar la sesión local
        this.clearSession();
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Renovar token de autenticación
   */
  refreshToken(): Observable<AuthResponse> {
    const token = this.getToken();

    return this.http.post<AuthResponse>(
      `${this.baseUrl}/api/auth/refresh`,
      { token },
      { headers: this.getHeaders() }
    ).pipe(
      tap(response => {
        this.handleAuthSuccess(response);
      })
    );
  }

  /**
   * Obtener información del usuario actual
   */
  getCurrentUser(): Observable<Usuario> {
    return this.http.get<Usuario>(
      `${this.baseUrl}/api/auth/me`,
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(usuario => {
        this.currentUser.set(usuario);
        this.saveUserToStorage(usuario);
      })
    );
  }

  /**
   * Verificar si el usuario tiene un permiso específico
   */
  hasPermission(permission: string): boolean {
    const permissions = this.userPermissions();
    return permissions.includes(permission);
  }

  /**
   * Verificar si el usuario tiene alguno de los permisos especificados
   */
  hasAnyPermission(permissions: string[]): boolean {
    const userPermissions = this.userPermissions();
    return permissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * Verificar si el usuario tiene todos los permisos especificados
   */
  hasAllPermissions(permissions: string[]): boolean {
    const userPermissions = this.userPermissions();
    return permissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Obtener token de autenticación
   */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obtener permisos del usuario actual
   */
  getPermissions(): string[] {
    return this.userPermissions();
  }

  /**
   * Verificar si el token está expirado
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // Decodificar JWT y verificar expiración
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convertir a milliseconds
      return Date.now() > expirationTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Manejar autenticación exitosa
   */
  private handleAuthSuccess(response: AuthResponse): void {
    // Guardar token
    localStorage.setItem(this.TOKEN_KEY, response.token);

    // Guardar usuario
    this.currentUser.set(response.usuario);
    this.saveUserToStorage(response.usuario);

    // Guardar permisos
    const permissions = this.extractPermissionsFromUser(response.usuario);
    this.userPermissions.set(permissions);
    localStorage.setItem(this.PERMISSIONS_KEY, JSON.stringify(permissions));

    // Actualizar estado
    this.isAuthenticated.set(true);
    this.authStatusSubject.next(true);
  }

  /**
   * Extraer permisos del usuario
   */
  private extractPermissionsFromUser(usuario: Usuario): string[] {
    if (!usuario.rol || !usuario.rol.permisos) {
      return [];
    }

    return usuario.rol.permisos.map(permiso =>
      `${permiso.recurso}:${permiso.accion}`
    );
  }

  /**
   * Restaurar sesión desde localStorage
   */
  private restoreSession(): void {
    const token = this.getToken();
    const userStr = localStorage.getItem(this.USER_KEY);
    const permissionsStr = localStorage.getItem(this.PERMISSIONS_KEY);

    if (token && userStr && !this.isTokenExpired()) {
      try {
        const user = JSON.parse(userStr);
        const permissions = permissionsStr ? JSON.parse(permissionsStr) : [];

        this.currentUser.set(user);
        this.userPermissions.set(permissions);
        this.isAuthenticated.set(true);
        this.authStatusSubject.next(true);

        // Opcional: verificar con el backend que la sesión sigue válida
        this.getCurrentUser().subscribe({
          error: () => {
            // Si falla, cerrar sesión
            this.clearSession();
          }
        });
      } catch (error) {
        this.clearSession();
      }
    } else {
      this.clearSession();
    }
  }

  /**
   * Limpiar sesión
   */
  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.PERMISSIONS_KEY);

    this.currentUser.set(null);
    this.userPermissions.set([]);
    this.isAuthenticated.set(false);
    this.authStatusSubject.next(false);
  }

  /**
   * Guardar usuario en localStorage
   */
  private saveUserToStorage(usuario: Usuario): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(usuario));
  }

  /**
   * Obtener headers básicos
   */
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  /**
   * Obtener headers con autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}
