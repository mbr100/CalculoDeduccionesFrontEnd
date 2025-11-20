# Sistema de Gestión de Usuarios, Roles y Permisos

## 📋 Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Componentes Principales](#componentes-principales)
4. [Endpoints y Permisos](#endpoints-y-permisos)
5. [Roles Predefinidos](#roles-predefinidos)
6. [Guía de Uso](#guía-de-uso)
7. [Ejemplos de Código](#ejemplos-de-código)

---

## 📖 Descripción General

Este sistema implementa un **Control de Acceso Basado en Roles (RBAC)** completo para Angular 20 con las siguientes características:

- ✅ Autenticación con JWT
- ✅ Gestión de usuarios, roles y permisos
- ✅ Guards para protección de rutas
- ✅ Directivas para mostrar/ocultar elementos según permisos
- ✅ Interceptor HTTP para tokens automáticos
- ✅ Interfaz de administración completa
- ✅ Matriz de permisos granular por endpoint

---

## 🏗️ Arquitectura del Sistema

### Estructura de Carpetas

```
src/app/
├── models/
│   ├── usuario.ts                    # Modelos de Usuario, Rol, Permiso
│   └── permission-matrix.ts          # Matriz de permisos y endpoints
├── services/
│   ├── auth.service.ts               # Autenticación y sesión
│   ├── usuario.service.ts            # CRUD de usuarios
│   ├── rol.service.ts                # CRUD de roles
│   └── permiso.service.ts            # Gestión de permisos
├── guards/
│   ├── auth.guard.ts                 # Verificar autenticación
│   └── permission.guard.ts           # Verificar permisos
├── interceptors/
│   └── auth.interceptor.ts           # Agregar token JWT
├── directives/
│   └── has-permission.directive.ts   # Directiva *hasPermission
├── utils/
│   └── permission.utils.ts           # Utilidades y hooks
├── pages/
│   ├── auth/
│   │   └── login/                    # Componente de login
│   └── admin/
│       ├── usuarios/                 # Gestión de usuarios
│       └── roles/                    # Gestión de roles
└── components/
    └── navbar/                       # Navbar con usuario autenticado
```

### Flujo de Autenticación

```
1. Usuario ingresa credenciales → AuthService.login()
2. Backend valida y retorna { token, usuario, permisos }
3. AuthService guarda en localStorage y actualiza signals
4. Interceptor agrega token a todas las peticiones HTTP
5. Guards verifican autenticación y permisos en cada navegación
```

---

## 🧩 Componentes Principales

### 1. **AuthService** (`services/auth.service.ts`)

Servicio central de autenticación que maneja:
- Login/Logout
- Almacenamiento de tokens
- Estado de autenticación (Signals)
- Verificación de permisos

**Métodos principales:**
```typescript
login(credentials: LoginCredentials): Observable<AuthResponse>
logout(): void
hasPermission(permission: string): boolean
hasAnyPermission(permissions: string[]): boolean
hasAllPermissions(permissions: string[]): boolean
getCurrentUser(): Observable<Usuario>
refreshToken(): Observable<AuthResponse>
```

### 2. **Guards** (`guards/`)

#### AuthGuard
Verifica que el usuario esté autenticado antes de acceder a una ruta.

```typescript
// En app.routes.ts
{
  path: 'dashboard',
  component: DashboardComponent,
  canActivate: [authGuard]
}
```

#### PermissionGuard
Verifica permisos específicos para acceder a una ruta.

```typescript
// Requiere AL MENOS UNO de los permisos
{
  path: 'usuarios',
  component: UsuariosComponent,
  canActivate: [authGuard, permissionGuard],
  data: {
    permissions: ['USUARIOS:LIST', 'USUARIOS:READ']
  }
}

// Requiere TODOS los permisos
{
  path: 'usuarios/crear',
  component: CrearUsuarioComponent,
  canActivate: [authGuard, permissionGuard],
  data: {
    permissions: ['USUARIOS:CREATE'],
    requireAll: true
  }
}
```

### 3. **Directiva HasPermission** (`directives/has-permission.directive.ts`)

Muestra/oculta elementos del DOM según permisos.

```html
<!-- Mostrar si tiene el permiso -->
<button *hasPermission="'USUARIOS:CREATE'">Crear Usuario</button>

<!-- Mostrar si tiene AL MENOS UNO de los permisos -->
<div *hasPermission="['USUARIOS:READ', 'USUARIOS:LIST']">
  Lista de usuarios
</div>

<!-- Mostrar si tiene TODOS los permisos -->
<button *hasPermission="['USUARIOS:UPDATE', 'USUARIOS:DELETE']; requireAll: true">
  Editar y Eliminar
</button>
```

### 4. **Auth Interceptor** (`interceptors/auth.interceptor.ts`)

Intercepta todas las peticiones HTTP y:
- Agrega automáticamente el token Bearer
- Maneja errores 401 (no autorizado) y 403 (prohibido)
- Redirige al login cuando sea necesario

### 5. **Utilidades de Permisos** (`utils/permission.utils.ts`)

Hook personalizado para usar en componentes:

```typescript
export class MiComponente {
  private permissions = usePermissions();

  // Verificar permisos
  canCreate = this.permissions.hasPermission('USUARIOS:CREATE');
  canEdit = this.permissions.hasAnyPermission(['USUARIOS:UPDATE', 'USUARIOS:CREATE']);

  // Signal computado reactivo
  canDelete = this.permissions.createPermissionSignal('USUARIOS:DELETE');
}
```

---

## 🔐 Endpoints y Permisos

### Matriz de Permisos

Cada endpoint de la API tiene permisos asociados en formato `RECURSO:ACCION`:

| Endpoint | Método | Permiso Requerido | Descripción |
|----------|--------|-------------------|-------------|
| `/api/economicos` | GET | `ECONOMICOS:LIST` | Listar económicos |
| `/api/economicos/:id` | GET | `ECONOMICOS:READ` | Ver detalle |
| `/api/economicos` | POST | `ECONOMICOS:CREATE` | Crear económico |
| `/api/economicos/actualizar` | PUT | `ECONOMICOS:UPDATE` | Actualizar |
| `/api/economicos` | DELETE | `ECONOMICOS:DELETE` | Eliminar |
| `/api/personal/economico/:id` | GET | `PERSONAL:LIST` | Listar personal |
| `/api/personal/economico/crear` | POST | `PERSONAL:CREATE` | Crear personal |
| `/api/personal/actualizar` | PUT | `PERSONAL:UPDATE` | Actualizar personal |
| `/api/proyectos` | GET | `PROYECTOS:LIST` | Listar proyectos |
| `/api/proyectos` | POST | `PROYECTOS:CREATE` | Crear proyecto |
| `/api/usuarios` | GET | `USUARIOS:LIST` | Listar usuarios |
| `/api/usuarios` | POST | `USUARIOS:CREATE` | Crear usuario |
| `/api/roles` | GET | `ROLES:LIST` | Listar roles |
| `/api/roles` | POST | `ROLES:CREATE` | Crear rol |

**Ver matriz completa en:** `src/app/models/permission-matrix.ts`

### Recursos Disponibles

```typescript
enum Recurso {
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
```

### Acciones Disponibles

```typescript
enum AccionPermiso {
  CREATE = 'CREATE',   // Crear
  READ = 'READ',       // Leer/Ver
  UPDATE = 'UPDATE',   // Actualizar
  DELETE = 'DELETE',   // Eliminar
  LIST = 'LIST',       // Listar
  EXECUTE = 'EXECUTE'  // Ejecutar (para acciones especiales)
}
```

---

## 👥 Roles Predefinidos

### 1. Super Administrador
- **Descripción:** Acceso completo a todas las funcionalidades
- **Permisos:** TODOS (60+ permisos)
- **Uso:** Administración total del sistema

### 2. Administrador
- **Descripción:** Gestión completa excepto usuarios y roles
- **Permisos:** Todos excepto `USUARIOS:*` y `ROLES:*`
- **Uso:** Administración operativa

### 3. Gestor (Manager)
- **Descripción:** Puede ver y editar datos pero no eliminar
- **Permisos:** `LIST`, `READ`, `CREATE`, `UPDATE` en recursos principales
- **Uso:** Gestión de datos sin permisos destructivos

### 4. Usuario
- **Descripción:** Solo lectura de datos
- **Permisos:** `LIST`, `READ` en todos los recursos
- **Uso:** Consulta y visualización

### 5. Invitado (Guest)
- **Descripción:** Acceso mínimo
- **Permisos:** `ECONOMICOS:LIST`, `RESUMEN:READ`
- **Uso:** Acceso limitado para visitantes

---

## 🚀 Guía de Uso

### Para Desarrolladores

#### 1. Proteger una Ruta

```typescript
// En app.routes.ts
import { authGuard } from './guards/auth.guard';
import { permissionGuard } from './guards/permission.guard';

export const routes: Routes = [
  {
    path: 'mi-ruta',
    component: MiComponente,
    canActivate: [authGuard, permissionGuard],
    data: {
      permissions: ['MI_RECURSO:READ']
    }
  }
];
```

#### 2. Usar Permisos en un Componente

```typescript
import { Component } from '@angular/core';
import { usePermissions, PERMISSIONS } from './utils/permission.utils';

@Component({
  selector: 'app-mi-componente',
  // ...
})
export class MiComponente {
  private permissions = usePermissions();
  public PERMS = PERMISSIONS.USUARIOS;

  // Verificar en código
  crearUsuario() {
    if (!this.permissions.hasPermission(this.PERMS.CREATE)) {
      alert('No tienes permisos');
      return;
    }
    // ... lógica de creación
  }
}
```

#### 3. Usar Directiva en Templates

```html
<!-- Mostrar botón solo si tiene permiso -->
<button *hasPermission="PERMS.CREATE" (click)="crear()">
  Crear Nuevo
</button>

<!-- Mostrar sección con múltiples permisos -->
<div *hasPermission="[PERMS.UPDATE, PERMS.DELETE]">
  <button (click)="editar()">Editar</button>
  <button (click)="eliminar()">Eliminar</button>
</div>
```

### Para Administradores

#### 1. Gestión de Usuarios

**Ruta:** `/admin/usuarios`

**Funcionalidades:**
- ✅ Listar usuarios con paginación y búsqueda
- ✅ Crear nuevos usuarios
- ✅ Editar usuarios existentes
- ✅ Activar/Desactivar usuarios
- ✅ Resetear contraseñas
- ✅ Asignar roles
- ✅ Eliminar usuarios

**Permisos necesarios:**
- `USUARIOS:LIST` - Ver listado
- `USUARIOS:CREATE` - Crear usuarios
- `USUARIOS:UPDATE` - Editar usuarios
- `USUARIOS:DELETE` - Eliminar usuarios

#### 2. Gestión de Roles

**Ruta:** `/admin/roles`

**Funcionalidades:**
- ✅ Listar roles con sus permisos
- ✅ Crear nuevos roles
- ✅ Editar roles existentes
- ✅ Asignar permisos a roles
- ✅ Ver permisos agrupados por recurso
- ✅ Selección masiva de permisos
- ✅ Eliminar roles

**Permisos necesarios:**
- `ROLES:LIST` - Ver listado
- `ROLES:CREATE` - Crear roles
- `ROLES:UPDATE` - Editar roles
- `ROLES:DELETE` - Eliminar roles

---

## 💻 Ejemplos de Código

### Ejemplo 1: Componente con Control de Permisos

```typescript
import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { usePermissions, PERMISSIONS } from '../utils/permission.utils';
import { HasPermissionDirective } from '../directives/has-permission.directive';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [CommonModule, HasPermissionDirective],
  template: `
    <div>
      <h1>Gestión de Productos</h1>

      <!-- Botón visible solo con permiso de creación -->
      <button *hasPermission="PERMS.PRODUCTOS.CREATE" (click)="crear()">
        Crear Producto
      </button>

      <!-- Lista de productos -->
      @for (producto of productos(); track producto.id) {
        <div>
          <h3>{{ producto.nombre }}</h3>

          <!-- Botones según permisos -->
          <button *hasPermission="PERMS.PRODUCTOS.UPDATE" (click)="editar(producto)">
            Editar
          </button>

          <button *hasPermission="PERMS.PRODUCTOS.DELETE" (click)="eliminar(producto)">
            Eliminar
          </button>
        </div>
      }
    </div>
  `
})
export class ProductosComponent {
  private permissions = usePermissions();

  // Definir permisos (asumiendo que existen)
  public PERMS = {
    PRODUCTOS: {
      LIST: 'PRODUCTOS:LIST',
      CREATE: 'PRODUCTOS:CREATE',
      UPDATE: 'PRODUCTOS:UPDATE',
      DELETE: 'PRODUCTOS:DELETE'
    }
  };

  public productos = signal([
    { id: 1, nombre: 'Producto 1' },
    { id: 2, nombre: 'Producto 2' }
  ]);

  crear() {
    // Lógica de creación
    console.log('Crear producto');
  }

  editar(producto: any) {
    // Verificación adicional en código
    if (!this.permissions.hasPermission(this.PERMS.PRODUCTOS.UPDATE)) {
      alert('No tienes permisos para editar');
      return;
    }
    console.log('Editar', producto);
  }

  eliminar(producto: any) {
    console.log('Eliminar', producto);
  }
}
```

### Ejemplo 2: Guard Personalizado con Permiso Específico

```typescript
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminOnlyGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUser();
  const isAdmin = user?.rol?.nombre === 'Super Administrador';

  if (!isAdmin) {
    router.navigate(['/']);
    return false;
  }

  return true;
};

// Uso en rutas
{
  path: 'panel-admin',
  component: PanelAdminComponent,
  canActivate: [authGuard, adminOnlyGuard]
}
```

### Ejemplo 3: Servicio Personalizado con Verificación de Permisos

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ProductoService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:8080/api/productos';

  createProducto(data: any): Observable<any> {
    // Verificar permiso antes de hacer la petición
    if (!this.authService.hasPermission('PRODUCTOS:CREATE')) {
      return throwError(() => new Error('No tienes permisos para crear productos'));
    }

    return this.http.post(this.apiUrl, data);
  }

  updateProducto(id: number, data: any): Observable<any> {
    if (!this.authService.hasPermission('PRODUCTOS:UPDATE')) {
      return throwError(() => new Error('No tienes permisos para actualizar productos'));
    }

    return this.http.put(`${this.apiUrl}/${id}`, data);
  }

  deleteProducto(id: number): Observable<any> {
    if (!this.authService.hasPermission('PRODUCTOS:DELETE')) {
      return throwError(() => new Error('No tienes permisos para eliminar productos'));
    }

    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
```

---

## 🔧 Configuración del Backend

El backend debe implementar los siguientes endpoints:

### Autenticación

```
POST /api/auth/login
Body: { username: string, password: string }
Response: {
  token: string,
  refreshToken?: string,
  usuario: Usuario,
  expiresIn: number
}

POST /api/auth/logout
Headers: Authorization: Bearer {token}

POST /api/auth/refresh
Body: { token: string }
Response: { token: string, expiresIn: number }

GET /api/auth/me
Headers: Authorization: Bearer {token}
Response: Usuario
```

### Usuarios

```
GET /api/usuarios?page=0&size=10
POST /api/usuarios
PUT /api/usuarios/:id
DELETE /api/usuarios/:id
PATCH /api/usuarios/:id/status
POST /api/usuarios/:id/change-password
POST /api/usuarios/:id/reset-password
```

### Roles

```
GET /api/roles?page=0&size=10
GET /api/roles/all
GET /api/roles/:id
POST /api/roles
PUT /api/roles/:id
DELETE /api/roles/:id
POST /api/roles/:id/permisos
GET /api/roles/:id/permisos
```

### Permisos

```
GET /api/permisos?page=0&size=50
GET /api/permisos/all
GET /api/permisos/:id
GET /api/permisos/grouped
GET /api/permisos/resource/:recurso
```

---

## 📝 Notas Importantes

1. **Tokens JWT:** Los tokens se almacenan en `localStorage` con la clave `auth_token`

2. **Expiración de Sesión:** El sistema verifica automáticamente la expiración del token y redirige al login

3. **Actualización de Permisos:** Los permisos se actualizan en cada login. Si un administrador cambia los permisos de un rol, el usuario debe volver a iniciar sesión

4. **Seguridad:**
   - Nunca almacenar información sensible en localStorage
   - El backend debe validar SIEMPRE los permisos
   - Los guards del frontend son solo para UX, no para seguridad

5. **Performance:**
   - Los permisos se cargan una vez al login
   - Se usan Signals para reactividad eficiente
   - El interceptor agrega el token sin verificaciones costosas

---

## 🐛 Troubleshooting

### Problema: "Token expirado constantemente"
**Solución:** Verificar que el backend retorne `expiresIn` correcto y que el JWT tenga el campo `exp`

### Problema: "Permisos no se actualizan"
**Solución:** El usuario debe cerrar sesión y volver a iniciar sesión para obtener los permisos actualizados

### Problema: "Guard redirige aunque tenga permisos"
**Solución:** Verificar que los permisos en `data.permissions` coincidan exactamente con los del backend (formato: `RECURSO:ACCION`)

### Problema: "Error 403 en todas las peticiones"
**Solución:** Verificar que el interceptor esté configurado correctamente en `app.config.ts` y que el token sea válido

---

## 📞 Soporte

Para dudas o problemas con el sistema de roles y permisos, contactar al equipo de desarrollo.

---

**Última actualización:** 2024-11-20
**Versión:** 1.0.0
**Angular:** 20.0.0
