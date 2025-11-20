import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import Swal from 'sweetalert2';

/**
 * Guard para proteger rutas basándose en permisos específicos
 *
 * Uso en rutas:
 * {
 *   path: 'usuarios',
 *   component: UsuariosComponent,
 *   canActivate: [permissionGuard],
 *   data: { permissions: ['USUARIOS:LIST', 'USUARIOS:READ'] }
 * }
 *
 * O para requerir TODOS los permisos:
 * data: { permissions: ['USUARIOS:CREATE'], requireAll: true }
 */
export const permissionGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar primero que esté autenticado
  if (!authService.isAuthenticated() || authService.isTokenExpired()) {
    console.warn('Usuario no autenticado, redirigiendo a login');
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Obtener permisos requeridos de la configuración de la ruta
  const requiredPermissions = route.data['permissions'] as string[] || [];
  const requireAll = route.data['requireAll'] as boolean || false;

  // Si no se especificaron permisos, permitir acceso (solo verificar autenticación)
  if (requiredPermissions.length === 0) {
    return true;
  }

  // Verificar permisos
  let hasAccess = false;

  if (requireAll) {
    // Requiere TODOS los permisos
    hasAccess = authService.hasAllPermissions(requiredPermissions);
  } else {
    // Requiere AL MENOS UNO de los permisos
    hasAccess = authService.hasAnyPermission(requiredPermissions);
  }

  if (!hasAccess) {
    console.warn('Acceso denegado. Permisos insuficientes');

    // Mostrar mensaje de error
    Swal.fire({
      icon: 'error',
      title: 'Acceso Denegado',
      text: 'No tienes permisos para acceder a esta sección.',
      confirmButtonText: 'Entendido',
      confirmButtonColor: '#2563eb'
    });

    // Redirigir a la página principal
    router.navigate(['/']);
    return false;
  }

  return true;
};

/**
 * Guard alternativo que verifica un único permiso
 *
 * Uso:
 * canActivate: [createPermissionGuard('USUARIOS:CREATE')]
 */
export function createPermissionGuard(permission: string): CanActivateFn {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated() || authService.isTokenExpired()) {
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    if (!authService.hasPermission(permission)) {
      Swal.fire({
        icon: 'error',
        title: 'Acceso Denegado',
        text: `Requiere el permiso: ${permission}`,
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#2563eb'
      });
      router.navigate(['/']);
      return false;
    }

    return true;
  };
}
