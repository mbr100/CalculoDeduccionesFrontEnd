/**
 * Modelo de Usuario del sistema
 */
export interface Usuario {
  id: number;
  username: string;
  email: string;
  nombre: string;
  apellidos: string;
  roleId: number;
  rol?: Rol;
  activo: boolean;
  fechaCreacion: Date;
  ultimoAcceso?: Date;
}

/**
 * DTO para crear o actualizar usuario
 */
export interface UsuarioDTO {
  id?: number;
  username: string;
  email: string;
  nombre: string;
  apellidos: string;
  password?: string;
  roleId: number;
  activo: boolean;
}

/**
 * Modelo de Rol
 */
export interface Rol {
  id: number;
  nombre: string;
  descripcion: string;
  permisos: Permiso[];
  activo: boolean;
}

/**
 * DTO para crear o actualizar rol
 */
export interface RolDTO {
  id?: number;
  nombre: string;
  descripcion: string;
  permisosIds: number[];
  activo: boolean;
}

/**
 * Modelo de Permiso
 */
export interface Permiso {
  id: number;
  recurso: string;
  accion: AccionPermiso;
  descripcion: string;
}

/**
 * Tipos de acciones para permisos
 */
export enum AccionPermiso {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LIST = 'LIST',
  EXECUTE = 'EXECUTE'
}

/**
 * Recursos del sistema
 */
export enum Recurso {
  ECONOMICOS = 'ECONOMICOS',
  PERSONAL = 'PERSONAL',
  PROYECTOS = 'PROYECTOS',
  ASIGNACIONES = 'ASIGNACIONES',
  RETRIBUCIONES = 'RETRIBUCIONES',
  COTIZACIONES = 'COTIZACIONES',
  ALTAS = 'ALTAS',
  BAJAS = 'BAJAS',
  BONIFICACIONES = 'BONIFICACIONES',
  USUARIOS = 'USUARIOS',
  ROLES = 'ROLES',
  PERMISOS = 'PERMISOS',
  RESUMEN = 'RESUMEN'
}

/**
 * Respuesta de autenticación
 */
export interface AuthResponse {
  token: string;
  refreshToken?: string;
  usuario: Usuario;
  expiresIn: number;
}

/**
 * Credenciales de login
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Información de la sesión del usuario
 */
export interface UserSession {
  usuario: Usuario;
  token: string;
  permisos: string[];
  expiresAt: number;
}
