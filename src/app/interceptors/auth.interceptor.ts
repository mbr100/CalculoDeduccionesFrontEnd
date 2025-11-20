import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import Swal from 'sweetalert2';

/**
 * Interceptor HTTP para agregar el token de autenticación a todas las peticiones
 * y manejar errores de autenticación globalmente
 *
 * Este interceptor:
 * 1. Agrega automáticamente el token Bearer a los headers
 * 2. Maneja errores 401 (no autorizado) y 403 (prohibido)
 * 3. Redirige al login cuando sea necesario
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Obtener token del localStorage
  const token = localStorage.getItem('auth_token');

  // Clonar la petición y agregar el token si existe
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Enviar la petición y manejar errores
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Error 401: No autenticado o token inválido
      if (error.status === 401) {
        console.error('Error 401: No autorizado');

        // Limpiar sesión
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user_permissions');

        // Mostrar mensaje
        Swal.fire({
          icon: 'warning',
          title: 'Sesión Expirada',
          text: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          confirmButtonText: 'Ir a Login',
          confirmButtonColor: '#2563eb',
          allowOutsideClick: false
        }).then(() => {
          // Redirigir a login con returnUrl
          const returnUrl = router.url;
          router.navigate(['/login'], { queryParams: { returnUrl } });
        });
      }

      // Error 403: Prohibido - sin permisos
      if (error.status === 403) {
        console.error('Error 403: Acceso prohibido');

        Swal.fire({
          icon: 'error',
          title: 'Acceso Denegado',
          text: 'No tienes permisos para realizar esta acción.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#2563eb'
        });
      }

      // Error 500: Error del servidor
      if (error.status === 500) {
        console.error('Error 500: Error del servidor', error);

        Swal.fire({
          icon: 'error',
          title: 'Error del Servidor',
          text: 'Ha ocurrido un error en el servidor. Por favor, intenta nuevamente.',
          confirmButtonText: 'Entendido',
          confirmButtonColor: '#2563eb'
        });
      }

      // Propagar el error
      return throwError(() => error);
    })
  );
};
