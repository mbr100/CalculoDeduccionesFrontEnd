import { Routes } from '@angular/router';
import {ListadoEconomicos} from './pages/economico/listado-economicos/listado-economicos';
import {NuevoEconomico} from './pages/economico/nuevo-economico/nuevo-economico';
import {VerEconomico} from './pages/economico/ver-economico/ver-economico';
import {PersonalEconomico} from './pages/personal/personal-economico/personal-economico';

export const routes: Routes = [
    { path: '', component: ListadoEconomicos },
    { path : 'nuevoEconomico', component: NuevoEconomico },
    { path: 'economico',
        children: [
            { path: 'ver/:id', component: VerEconomico },
            { path: 'personal/:id', component: PersonalEconomico },
        ]
    },
];
