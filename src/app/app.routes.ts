import { Routes } from '@angular/router';
import {ListadoEconomicos} from './pages/economico/listado-economicos/listado-economicos';
import {NuevoEconomico} from './pages/economico/nuevo-economico/nuevo-economico';

export const routes: Routes = [
    { path: '', component: ListadoEconomicos },
    { path : 'nuevoEconomico', component: NuevoEconomico },
];
