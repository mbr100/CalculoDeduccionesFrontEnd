import { Routes } from '@angular/router';
import {ListadoEconomicos} from './pages/economico/listado-economicos/listado-economicos';
import {NuevoEconomico} from './pages/economico/nuevo-economico/nuevo-economico';
import {VerEconomico} from './pages/economico/ver-economico/ver-economico';
import {PersonalEconomico} from './pages/personal/personal-economico/personal-economico';
import {ListadoProyectos} from './pages/proyectos/listado-proyectos/listado-proyectos';
import {Asignaciones} from './pages/asignaciones/asignaciones/asignaciones';
import {ResumenEconomico} from './pages/resumen/resumen-economico/resumen-economico';

export const routes: Routes = [
    { path: '', component: ListadoEconomicos },
    { path : 'nuevoEconomico', component: NuevoEconomico },
    { path: 'economico',
        children: [
            { path: 'ver/:id', component: VerEconomico },
            { path: 'personal/:id', component: PersonalEconomico },
            { path: 'proyectos/:id', component:  ListadoProyectos},
            { path: 'asignaciones/:id', component:  Asignaciones},
            { path: 'resumen/:id', component:  ResumenEconomico},
        ]
    },
];
