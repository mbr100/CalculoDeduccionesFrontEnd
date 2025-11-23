/**
 * MATRIZ DE PERMISOS DEL SISTEMA
 *
 * Define todos los endpoints de la aplicación y los permisos necesarios
 * para acceder a cada uno de ellos.
 */

import { AccionPermiso, Recurso } from './usuario';

/**
 * Definición de un endpoint con sus permisos requeridos
 */
export interface EndpointPermission {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  descripcion: string;
  recurso: Recurso;
  accion: AccionPermiso;
  permiso: string; // Formato: RECURSO:ACCION (ej: ECONOMICOS:READ)
}

/**
 * MATRIZ COMPLETA DE PERMISOS
 * Todos los endpoints de la API con sus permisos asociados
 */
export const ENDPOINTS_PERMISSIONS: EndpointPermission[] = [
  // ============================================
  // ECONÓMICOS
  // ============================================
  {
    method: 'GET',
    path: '/api/economicos',
    descripcion: 'Listar económicos con paginación',
    recurso: Recurso.ECONOMICOS,
    accion: AccionPermiso.LIST,
    permiso: 'ECONOMICOS:LIST'
  },
  {
    method: 'GET',
    path: '/api/economicos/:id',
    descripcion: 'Obtener detalle de un económico',
    recurso: Recurso.ECONOMICOS,
    accion: AccionPermiso.READ,
    permiso: 'ECONOMICOS:READ'
  },
  {
    method: 'POST',
    path: '/api/economicos',
    descripcion: 'Crear nuevo económico',
    recurso: Recurso.ECONOMICOS,
    accion: AccionPermiso.CREATE,
    permiso: 'ECONOMICOS:CREATE'
  },
  {
    method: 'PUT',
    path: '/api/economicos/actualizar',
    descripcion: 'Actualizar económico existente',
    recurso: Recurso.ECONOMICOS,
    accion: AccionPermiso.UPDATE,
    permiso: 'ECONOMICOS:UPDATE'
  },
  {
    method: 'DELETE',
    path: '/api/economicos',
    descripcion: 'Eliminar económico',
    recurso: Recurso.ECONOMICOS,
    accion: AccionPermiso.DELETE,
    permiso: 'ECONOMICOS:DELETE'
  },
  {
    method: 'GET',
    path: '/api/economicos/:id/resumen',
    descripcion: 'Obtener resumen de gasto por proyecto',
    recurso: Recurso.RESUMEN,
    accion: AccionPermiso.READ,
    permiso: 'RESUMEN:READ'
  },

  // ============================================
  // PERSONAL
  // ============================================
  {
    method: 'GET',
    path: '/api/personal/economico/:id',
    descripcion: 'Listar personal de un económico',
    recurso: Recurso.PERSONAL,
    accion: AccionPermiso.LIST,
    permiso: 'PERSONAL:LIST'
  },
  {
    method: 'POST',
    path: '/api/personal/economico/crear',
    descripcion: 'Crear personal en económico',
    recurso: Recurso.PERSONAL,
    accion: AccionPermiso.CREATE,
    permiso: 'PERSONAL:CREATE'
  },
  {
    method: 'PUT',
    path: '/api/personal/actualizar',
    descripcion: 'Actualizar datos de personal',
    recurso: Recurso.PERSONAL,
    accion: AccionPermiso.UPDATE,
    permiso: 'PERSONAL:UPDATE'
  },
  {
    method: 'DELETE',
    path: '/api/personal/:id_economico/:id_persona',
    descripcion: 'Eliminar personal de económico',
    recurso: Recurso.PERSONAL,
    accion: AccionPermiso.DELETE,
    permiso: 'PERSONAL:DELETE'
  },

  // ============================================
  // RETRIBUCIONES
  // ============================================
  {
    method: 'GET',
    path: '/api/personal/:id/retribuciones',
    descripcion: 'Listar retribuciones de personal',
    recurso: Recurso.RETRIBUCIONES,
    accion: AccionPermiso.LIST,
    permiso: 'RETRIBUCIONES:LIST'
  },
  {
    method: 'PUT',
    path: '/api/personal/retribucion',
    descripcion: 'Actualizar retribución de personal',
    recurso: Recurso.RETRIBUCIONES,
    accion: AccionPermiso.UPDATE,
    permiso: 'RETRIBUCIONES:UPDATE'
  },

  // ============================================
  // BASES DE COTIZACIÓN
  // ============================================
  {
    method: 'GET',
    path: '/api/personal/:id/cotizaciones',
    descripcion: 'Listar bases de cotización',
    recurso: Recurso.COTIZACIONES,
    accion: AccionPermiso.LIST,
    permiso: 'COTIZACIONES:LIST'
  },
  {
    method: 'PUT',
    path: '/api/personal/bbcc',
    descripcion: 'Actualizar bases de cotización',
    recurso: Recurso.COTIZACIONES,
    accion: AccionPermiso.UPDATE,
    permiso: 'COTIZACIONES:UPDATE'
  },

  // ============================================
  // ALTAS EN EJERCICIO
  // ============================================
  {
    method: 'GET',
    path: '/api/personal/:id/alta-ejercicio',
    descripcion: 'Listar altas en ejercicio',
    recurso: Recurso.ALTAS,
    accion: AccionPermiso.LIST,
    permiso: 'ALTAS:LIST'
  },
  {
    method: 'PUT',
    path: '/api/personal/alta-ejercicio',
    descripcion: 'Actualizar alta en ejercicio',
    recurso: Recurso.ALTAS,
    accion: AccionPermiso.UPDATE,
    permiso: 'ALTAS:UPDATE'
  },

  // ============================================
  // BAJAS LABORALES
  // ============================================
  {
    method: 'GET',
    path: '/api/personal/:id/bajas-laborales',
    descripcion: 'Listar bajas laborales de personal',
    recurso: Recurso.BAJAS,
    accion: AccionPermiso.LIST,
    permiso: 'BAJAS:LIST'
  },
  {
    method: 'POST',
    path: '/api/personal/baja-laboral',
    descripcion: 'Crear nueva baja laboral',
    recurso: Recurso.BAJAS,
    accion: AccionPermiso.CREATE,
    permiso: 'BAJAS:CREATE'
  },
  {
    method: 'PUT',
    path: '/api/personal/baja-laboral',
    descripcion: 'Actualizar baja laboral',
    recurso: Recurso.BAJAS,
    accion: AccionPermiso.UPDATE,
    permiso: 'BAJAS:UPDATE'
  },
  {
    method: 'DELETE',
    path: '/api/personal/baja-laboral/:id',
    descripcion: 'Eliminar baja laboral',
    recurso: Recurso.BAJAS,
    accion: AccionPermiso.DELETE,
    permiso: 'BAJAS:DELETE'
  },

  // ============================================
  // BONIFICACIONES
  // ============================================
  {
    method: 'GET',
    path: '/api/personal/:id/bonificaciones',
    descripcion: 'Listar bonificaciones de personal',
    recurso: Recurso.BONIFICACIONES,
    accion: AccionPermiso.LIST,
    permiso: 'BONIFICACIONES:LIST'
  },
  {
    method: 'POST',
    path: '/api/personal/bonificacion',
    descripcion: 'Crear nueva bonificación',
    recurso: Recurso.BONIFICACIONES,
    accion: AccionPermiso.CREATE,
    permiso: 'BONIFICACIONES:CREATE'
  },
  {
    method: 'PUT',
    path: '/api/personal/bonificacion',
    descripcion: 'Actualizar bonificación',
    recurso: Recurso.BONIFICACIONES,
    accion: AccionPermiso.UPDATE,
    permiso: 'BONIFICACIONES:UPDATE'
  },
  {
    method: 'DELETE',
    path: '/api/personal/bonificacion/:id',
    descripcion: 'Eliminar bonificación',
    recurso: Recurso.BONIFICACIONES,
    accion: AccionPermiso.DELETE,
    permiso: 'BONIFICACIONES:DELETE'
  },

  // ============================================
  // RESUMEN COSTE HORA PERSONAL
  // ============================================
  {
    method: 'GET',
    path: '/api/personal/:id/resumen-coste-personal',
    descripcion: 'Obtener resumen de coste hora de personal',
    recurso: Recurso.PERSONAL,
    accion: AccionPermiso.READ,
    permiso: 'PERSONAL:READ'
  },
  {
    method: 'POST',
    path: '/api/personal/:id/actualizarCosteHoraPersonal',
    descripcion: 'Recalcular coste hora de personal',
    recurso: Recurso.PERSONAL,
    accion: AccionPermiso.EXECUTE,
    permiso: 'PERSONAL:EXECUTE'
  },

  // ============================================
  // PROYECTOS
  // ============================================
  {
    method: 'GET',
    path: '/api/proyectos/economico/:id',
    descripcion: 'Listar proyectos de un económico',
    recurso: Recurso.PROYECTOS,
    accion: AccionPermiso.LIST,
    permiso: 'PROYECTOS:LIST'
  },
  {
    method: 'POST',
    path: '/api/proyectos',
    descripcion: 'Crear nuevo proyecto',
    recurso: Recurso.PROYECTOS,
    accion: AccionPermiso.CREATE,
    permiso: 'PROYECTOS:CREATE'
  },
  {
    method: 'PUT',
    path: '/api/proyectos',
    descripcion: 'Actualizar proyecto',
    recurso: Recurso.PROYECTOS,
    accion: AccionPermiso.UPDATE,
    permiso: 'PROYECTOS:UPDATE'
  },
  {
    method: 'DELETE',
    path: '/api/proyectos/:id',
    descripcion: 'Eliminar proyecto',
    recurso: Recurso.PROYECTOS,
    accion: AccionPermiso.DELETE,
    permiso: 'PROYECTOS:DELETE'
  },

  // ============================================
  // ASIGNACIONES
  // ============================================
  {
    method: 'GET',
    path: '/api/proyectos/asignaciones/:id',
    descripcion: 'Obtener matriz de asignaciones',
    recurso: Recurso.ASIGNACIONES,
    accion: AccionPermiso.LIST,
    permiso: 'ASIGNACIONES:LIST'
  },
  {
    method: 'PUT',
    path: '/api/proyectos/asignaciones',
    descripcion: 'Actualizar asignación de personal a proyecto',
    recurso: Recurso.ASIGNACIONES,
    accion: AccionPermiso.UPDATE,
    permiso: 'ASIGNACIONES:UPDATE'
  },

  // ============================================
  // USUARIOS (Sistema de gestión)
  // ============================================
  {
    method: 'GET',
    path: '/api/usuarios',
    descripcion: 'Listar usuarios del sistema',
    recurso: Recurso.USUARIOS,
    accion: AccionPermiso.LIST,
    permiso: 'USUARIOS:LIST'
  },
  {
    method: 'GET',
    path: '/api/usuarios/:id',
    descripcion: 'Obtener detalle de usuario',
    recurso: Recurso.USUARIOS,
    accion: AccionPermiso.READ,
    permiso: 'USUARIOS:READ'
  },
  {
    method: 'POST',
    path: '/api/usuarios',
    descripcion: 'Crear nuevo usuario',
    recurso: Recurso.USUARIOS,
    accion: AccionPermiso.CREATE,
    permiso: 'USUARIOS:CREATE'
  },
  {
    method: 'PUT',
    path: '/api/usuarios/:id',
    descripcion: 'Actualizar usuario',
    recurso: Recurso.USUARIOS,
    accion: AccionPermiso.UPDATE,
    permiso: 'USUARIOS:UPDATE'
  },
  {
    method: 'DELETE',
    path: '/api/usuarios/:id',
    descripcion: 'Eliminar usuario',
    recurso: Recurso.USUARIOS,
    accion: AccionPermiso.DELETE,
    permiso: 'USUARIOS:DELETE'
  },

  // ============================================
  // ROLES (Sistema de gestión)
  // ============================================
  {
    method: 'GET',
    path: '/api/roles',
    descripcion: 'Listar roles del sistema',
    recurso: Recurso.ROLES,
    accion: AccionPermiso.LIST,
    permiso: 'ROLES:LIST'
  },
  {
    method: 'GET',
    path: '/api/roles/:id',
    descripcion: 'Obtener detalle de rol',
    recurso: Recurso.ROLES,
    accion: AccionPermiso.READ,
    permiso: 'ROLES:READ'
  },
  {
    method: 'POST',
    path: '/api/roles',
    descripcion: 'Crear nuevo rol',
    recurso: Recurso.ROLES,
    accion: AccionPermiso.CREATE,
    permiso: 'ROLES:CREATE'
  },
  {
    method: 'PUT',
    path: '/api/roles/:id',
    descripcion: 'Actualizar rol',
    recurso: Recurso.ROLES,
    accion: AccionPermiso.UPDATE,
    permiso: 'ROLES:UPDATE'
  },
  {
    method: 'DELETE',
    path: '/api/roles/:id',
    descripcion: 'Eliminar rol',
    recurso: Recurso.ROLES,
    accion: AccionPermiso.DELETE,
    permiso: 'ROLES:DELETE'
  },

  // ============================================
  // PERMISOS (Sistema de gestión)
  // ============================================
  {
    method: 'GET',
    path: '/api/permisos',
    descripcion: 'Listar todos los permisos disponibles',
    recurso: Recurso.PERMISOS,
    accion: AccionPermiso.LIST,
    permiso: 'PERMISOS:LIST'
  },
  {
    method: 'GET',
    path: '/api/permisos/:id',
    descripcion: 'Obtener detalle de permiso',
    recurso: Recurso.PERMISOS,
    accion: AccionPermiso.READ,
    permiso: 'PERMISOS:READ'
  }
];

/**
 * ROLES PREDEFINIDOS DEL SISTEMA
 */
export const ROLES_PREDEFINIDOS = {
  SUPER_ADMIN: {
    nombre: 'Super Administrador',
    descripcion: 'Acceso completo a todas las funcionalidades del sistema',
    permisos: [
      // Todos los permisos
      'ECONOMICOS:LIST', 'ECONOMICOS:READ', 'ECONOMICOS:CREATE', 'ECONOMICOS:UPDATE', 'ECONOMICOS:DELETE',
      'PERSONAL:LIST', 'PERSONAL:READ', 'PERSONAL:CREATE', 'PERSONAL:UPDATE', 'PERSONAL:DELETE', 'PERSONAL:EXECUTE',
      'PROYECTOS:LIST', 'PROYECTOS:READ', 'PROYECTOS:CREATE', 'PROYECTOS:UPDATE', 'PROYECTOS:DELETE',
      'ASIGNACIONES:LIST', 'ASIGNACIONES:UPDATE',
      'RETRIBUCIONES:LIST', 'RETRIBUCIONES:UPDATE',
      'COTIZACIONES:LIST', 'COTIZACIONES:UPDATE',
      'ALTAS:LIST', 'ALTAS:UPDATE',
      'BAJAS:LIST', 'BAJAS:CREATE', 'BAJAS:UPDATE', 'BAJAS:DELETE',
      'BONIFICACIONES:LIST', 'BONIFICACIONES:CREATE', 'BONIFICACIONES:UPDATE', 'BONIFICACIONES:DELETE',
      'USUARIOS:LIST', 'USUARIOS:READ', 'USUARIOS:CREATE', 'USUARIOS:UPDATE', 'USUARIOS:DELETE',
      'ROLES:LIST', 'ROLES:READ', 'ROLES:CREATE', 'ROLES:UPDATE', 'ROLES:DELETE',
      'PERMISOS:LIST', 'PERMISOS:READ',
      'RESUMEN:READ'
    ]
  },
  ADMIN: {
    nombre: 'Administrador',
    descripcion: 'Gestión completa excepto configuración de usuarios y roles',
    permisos: [
      'ECONOMICOS:LIST', 'ECONOMICOS:READ', 'ECONOMICOS:CREATE', 'ECONOMICOS:UPDATE', 'ECONOMICOS:DELETE',
      'PERSONAL:LIST', 'PERSONAL:READ', 'PERSONAL:CREATE', 'PERSONAL:UPDATE', 'PERSONAL:DELETE', 'PERSONAL:EXECUTE',
      'PROYECTOS:LIST', 'PROYECTOS:READ', 'PROYECTOS:CREATE', 'PROYECTOS:UPDATE', 'PROYECTOS:DELETE',
      'ASIGNACIONES:LIST', 'ASIGNACIONES:UPDATE',
      'RETRIBUCIONES:LIST', 'RETRIBUCIONES:UPDATE',
      'COTIZACIONES:LIST', 'COTIZACIONES:UPDATE',
      'ALTAS:LIST', 'ALTAS:UPDATE',
      'BAJAS:LIST', 'BAJAS:CREATE', 'BAJAS:UPDATE', 'BAJAS:DELETE',
      'BONIFICACIONES:LIST', 'BONIFICACIONES:CREATE', 'BONIFICACIONES:UPDATE', 'BONIFICACIONES:DELETE',
      'RESUMEN:READ'
    ]
  },
  MANAGER: {
    nombre: 'Gestor',
    descripcion: 'Puede ver y editar datos pero no eliminar',
    permisos: [
      'ECONOMICOS:LIST', 'ECONOMICOS:READ', 'ECONOMICOS:CREATE', 'ECONOMICOS:UPDATE',
      'PERSONAL:LIST', 'PERSONAL:READ', 'PERSONAL:CREATE', 'PERSONAL:UPDATE',
      'PROYECTOS:LIST', 'PROYECTOS:READ', 'PROYECTOS:CREATE', 'PROYECTOS:UPDATE',
      'ASIGNACIONES:LIST', 'ASIGNACIONES:UPDATE',
      'RETRIBUCIONES:LIST', 'RETRIBUCIONES:UPDATE',
      'COTIZACIONES:LIST', 'COTIZACIONES:UPDATE',
      'ALTAS:LIST', 'ALTAS:UPDATE',
      'BAJAS:LIST', 'BAJAS:CREATE', 'BAJAS:UPDATE',
      'BONIFICACIONES:LIST', 'BONIFICACIONES:CREATE', 'BONIFICACIONES:UPDATE',
      'RESUMEN:READ'
    ]
  },
  USER: {
    nombre: 'Usuario',
    descripcion: 'Solo lectura de datos',
    permisos: [
      'ECONOMICOS:LIST', 'ECONOMICOS:READ',
      'PERSONAL:LIST', 'PERSONAL:READ',
      'PROYECTOS:LIST', 'PROYECTOS:READ',
      'ASIGNACIONES:LIST',
      'RETRIBUCIONES:LIST',
      'COTIZACIONES:LIST',
      'ALTAS:LIST',
      'BAJAS:LIST',
      'BONIFICACIONES:LIST',
      'RESUMEN:READ'
    ]
  },
  GUEST: {
    nombre: 'Invitado',
    descripcion: 'Acceso mínimo solo para visualizar resúmenes',
    permisos: [
      'ECONOMICOS:LIST',
      'RESUMEN:READ'
    ]
  }
};

/**
 * Helper para verificar si un conjunto de permisos incluye el permiso especificado
 */
export function tienePermiso(permisosUsuario: string[], permisoRequerido: string): boolean {
  return permisosUsuario.includes(permisoRequerido);
}

/**
 * Helper para verificar si un conjunto de permisos incluye ALGUNO de los permisos especificados
 */
export function tieneAlgunPermiso(permisosUsuario: string[], permisosRequeridos: string[]): boolean {
  return permisosRequeridos.some(permiso => permisosUsuario.includes(permiso));
}

/**
 * Helper para verificar si un conjunto de permisos incluye TODOS los permisos especificados
 */
export function tieneTodosLosPermisos(permisosUsuario: string[], permisosRequeridos: string[]): boolean {
  return permisosRequeridos.every(permiso => permisosUsuario.includes(permiso));
}
