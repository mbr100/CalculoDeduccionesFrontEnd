import { Routes } from '@angular/router';
import { ListadoEconomicos } from './pages/economico/listado-economicos/listado-economicos';
import { NuevoEconomico } from './pages/economico/nuevo-economico/nuevo-economico';
import { VerEconomico } from './pages/economico/ver-economico/ver-economico';
import { PersonalEconomico } from './pages/personal/personal-economico/personal-economico';
import { ListadoProyectos } from './pages/proyectos/listado-proyectos/listado-proyectos';
import { Asignaciones } from './pages/asignaciones/asignaciones/asignaciones';
import { ResumenEconomico } from './pages/resumen/resumen-economico/resumen-economico';
import { Login } from './pages/auth/login/login';
import { Usuarios } from './pages/admin/usuarios/usuarios';
import { Roles } from './pages/admin/roles/roles';
import { authGuard } from './guards/auth.guard';
import { permissionGuard } from './guards/permission.guard';

export const routes: Routes = [
    // Ruta pública de login
    { path: 'login', component: Login },

    // Rutas protegidas con autenticación
    {
        path: '',
        component: ListadoEconomicos,
        canActivate: [authGuard],
        data: {
            permissions: ['ECONOMICOS:LIST']
        }
    },
    {
        path: 'nuevoEconomico',
        component: NuevoEconomico,
        canActivate: [authGuard, permissionGuard],
        data: {
            permissions: ['ECONOMICOS:CREATE']
        }
    },
    {
        path: 'economico',
        canActivate: [authGuard],
        children: [
            {
                path: 'ver/:id',
                component: VerEconomico,
                canActivate: [permissionGuard],
                data: {
                    permissions: ['ECONOMICOS:READ']
                }
            },
            {
                path: 'personal/:id',
                component: PersonalEconomico,
                canActivate: [permissionGuard],
                data: {
                    permissions: ['PERSONAL:LIST', 'PERSONAL:READ']
                }
            },
            {
                path: 'proyectos/:id',
                component: ListadoProyectos,
                canActivate: [permissionGuard],
                data: {
                    permissions: ['PROYECTOS:LIST', 'PROYECTOS:READ']
                }
            },
            {
                path: 'asignaciones/:id',
                component: Asignaciones,
                canActivate: [permissionGuard],
                data: {
                    permissions: ['ASIGNACIONES:LIST']
                }
            },
            {
                path: 'resumen/:id',
                component: ResumenEconomico,
                canActivate: [permissionGuard],
                data: {
                    permissions: ['RESUMEN:READ']
                }
            },
        ]
    },

    // Rutas de administración
    {
        path: 'admin/usuarios',
        component: Usuarios,
        canActivate: [authGuard, permissionGuard],
        data: {
            permissions: ['USUARIOS:LIST']
        }
    },
    {
        path: 'admin/roles',
        component: Roles,
        canActivate: [authGuard, permissionGuard],
        data: {
            permissions: ['ROLES:LIST']
        }
    },

    // Redireccionar cualquier ruta no encontrada a la página principal
    { path: '**', redirectTo: '' }
];
