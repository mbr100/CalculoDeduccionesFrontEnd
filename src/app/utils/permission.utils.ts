/**
 * Utilidades para trabajar con permisos en componentes
 */

import { inject, Signal, computed } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Hook personalizado para verificar permisos en componentes
 *
 * Uso en un componente:
 * ```typescript
 * export class MiComponente {
 *   private permissionUtils = usePermissions();
 *
 *   canCreate = this.permissionUtils.hasPermission('USUARIOS:CREATE');
 *   canEdit = this.permissionUtils.hasAnyPermission(['USUARIOS:UPDATE', 'USUARIOS:CREATE']);
 * }
 * ```
 */
export function usePermissions() {
  const authService = inject(AuthService);

  return {
    /**
     * Signal que indica si el usuario está autenticado
     */
    isAuthenticated: authService.isAuthenticated,

    /**
     * Signal con el usuario actual
     */
    currentUser: authService.currentUser,

    /**
     * Signal con los permisos del usuario
     */
    userPermissions: authService.userPermissions,

    /**
     * Signal que indica si el usuario es administrador
     */
    isAdmin: authService.isAdmin,

    /**
     * Verifica si el usuario tiene un permiso específico
     */
    hasPermission: (permission: string): boolean => {
      return authService.hasPermission(permission);
    },

    /**
     * Verifica si el usuario tiene alguno de los permisos especificados
     */
    hasAnyPermission: (permissions: string[]): boolean => {
      return authService.hasAnyPermission(permissions);
    },

    /**
     * Verifica si el usuario tiene todos los permisos especificados
     */
    hasAllPermissions: (permissions: string[]): boolean => {
      return authService.hasAllPermissions(permissions);
    },

    /**
     * Crea un signal computado que verifica un permiso
     */
    createPermissionSignal: (permission: string): Signal<boolean> => {
      return computed(() => {
        const permissions = authService.userPermissions();
        return permissions.includes(permission);
      });
    },

    /**
     * Crea un signal computado que verifica múltiples permisos (al menos uno)
     */
    createAnyPermissionSignal: (permissions: string[]): Signal<boolean> => {
      return computed(() => {
        const userPermissions = authService.userPermissions();
        return permissions.some(p => userPermissions.includes(p));
      });
    },

    /**
     * Crea un signal computado que verifica múltiples permisos (todos)
     */
    createAllPermissionsSignal: (permissions: string[]): Signal<boolean> => {
      return computed(() => {
        const userPermissions = authService.userPermissions();
        return permissions.every(p => userPermissions.includes(p));
      });
    }
  };
}

/**
 * Clase helper para trabajar con permisos de forma más declarativa
 */
export class PermissionChecker {
  constructor(private permissions: string[]) {}

  /**
   * Verifica si incluye un permiso específico
   */
  has(permission: string): boolean {
    return this.permissions.includes(permission);
  }

  /**
   * Verifica si incluye alguno de los permisos
   */
  hasAny(...permissions: string[]): boolean {
    return permissions.some(p => this.permissions.includes(p));
  }

  /**
   * Verifica si incluye todos los permisos
   */
  hasAll(...permissions: string[]): boolean {
    return permissions.every(p => this.permissions.includes(p));
  }

  /**
   * Verifica permisos por recurso y acción
   */
  can(recurso: string, accion: string): boolean {
    return this.permissions.includes(`${recurso}:${accion}`);
  }

  /**
   * Obtiene todos los permisos de un recurso específico
   */
  getResourcePermissions(recurso: string): string[] {
    return this.permissions.filter(p => p.startsWith(`${recurso}:`));
  }

  /**
   * Obtiene todas las acciones disponibles para un recurso
   */
  getResourceActions(recurso: string): string[] {
    return this.getResourcePermissions(recurso)
      .map(p => p.split(':')[1]);
  }
}

/**
 * Constantes de permisos para evitar typos
 */
export const PERMISSIONS = {
  ECONOMICOS: {
    LIST: 'ECONOMICOS:LIST',
    READ: 'ECONOMICOS:READ',
    CREATE: 'ECONOMICOS:CREATE',
    UPDATE: 'ECONOMICOS:UPDATE',
    DELETE: 'ECONOMICOS:DELETE'
  },
  PERSONAL: {
    LIST: 'PERSONAL:LIST',
    READ: 'PERSONAL:READ',
    CREATE: 'PERSONAL:CREATE',
    UPDATE: 'PERSONAL:UPDATE',
    DELETE: 'PERSONAL:DELETE',
    EXECUTE: 'PERSONAL:EXECUTE'
  },
  PROYECTOS: {
    LIST: 'PROYECTOS:LIST',
    READ: 'PROYECTOS:READ',
    CREATE: 'PROYECTOS:CREATE',
    UPDATE: 'PROYECTOS:UPDATE',
    DELETE: 'PROYECTOS:DELETE'
  },
  ASIGNACIONES: {
    LIST: 'ASIGNACIONES:LIST',
    UPDATE: 'ASIGNACIONES:UPDATE'
  },
  RETRIBUCIONES: {
    LIST: 'RETRIBUCIONES:LIST',
    UPDATE: 'RETRIBUCIONES:UPDATE'
  },
  COTIZACIONES: {
    LIST: 'COTIZACIONES:LIST',
    UPDATE: 'COTIZACIONES:UPDATE'
  },
  ALTAS: {
    LIST: 'ALTAS:LIST',
    UPDATE: 'ALTAS:UPDATE'
  },
  BAJAS: {
    LIST: 'BAJAS:LIST',
    CREATE: 'BAJAS:CREATE',
    UPDATE: 'BAJAS:UPDATE',
    DELETE: 'BAJAS:DELETE'
  },
  BONIFICACIONES: {
    LIST: 'BONIFICACIONES:LIST',
    CREATE: 'BONIFICACIONES:CREATE',
    UPDATE: 'BONIFICACIONES:UPDATE',
    DELETE: 'BONIFICACIONES:DELETE'
  },
  USUARIOS: {
    LIST: 'USUARIOS:LIST',
    READ: 'USUARIOS:READ',
    CREATE: 'USUARIOS:CREATE',
    UPDATE: 'USUARIOS:UPDATE',
    DELETE: 'USUARIOS:DELETE'
  },
  ROLES: {
    LIST: 'ROLES:LIST',
    READ: 'ROLES:READ',
    CREATE: 'ROLES:CREATE',
    UPDATE: 'ROLES:UPDATE',
    DELETE: 'ROLES:DELETE'
  },
  PERMISOS: {
    LIST: 'PERMISOS:LIST',
    READ: 'PERMISOS:READ'
  },
  RESUMEN: {
    READ: 'RESUMEN:READ'
  }
} as const;
