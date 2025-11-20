import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard para proteger rutas que requieren autenticación
 *
 * Uso en rutas:
 * { path: 'ruta-protegida', component: MiComponente, canActivate: [authGuard] }
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si el usuario está autenticado
  if (authService.isAuthenticated()) {
    // Verificar si el token no ha expirado
    if (!authService.isTokenExpired()) {
      return true;
    } else {
      // Token expirado, intentar refrescar
      console.warn('Token expirado, redirigiendo a login');
      authService.logout();
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }
  }

  // No autenticado, redirigir a login
  console.warn('Usuario no autenticado, redirigiendo a login');
  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
