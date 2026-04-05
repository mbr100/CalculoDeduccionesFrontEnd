import { Routes } from '@angular/router';
import {ListadoEconomicos} from './pages/economico/listado-economicos/listado-economicos';
import {NuevoEconomico} from './pages/economico/nuevo-economico/nuevo-economico';
import {VerEconomico} from './pages/economico/ver-economico/ver-economico';
import {PersonalEconomico} from './pages/personal/personal-economico/personal-economico';
import {ListadoProyectos} from './pages/proyectos/listado-proyectos/listado-proyectos';
import {Asignaciones} from './pages/asignaciones/asignaciones/asignaciones';
import {ResumenEconomico} from './pages/resumen/resumen-economico/resumen-economico';
import {ColaboracionesExternas} from './pages/colaboraciones/colaboraciones-externas/colaboraciones-externas';
import {MaterialesFungibles} from './pages/materiales/materiales-fungibles/materiales-fungibles';
import {ConfiguracionAnualSSComponent} from './pages/mantenimientos/configuracion-anual-ss/configuracion-anual-ss';
import {TarifaPrimasCnaeComponent} from './pages/mantenimientos/tarifa-primas-cnae/tarifa-primas-cnae';
import {ClavesOcupacionComponent} from './pages/mantenimientos/claves-ocupacion/claves-ocupacion';

export const routes: Routes = [
    { path: '', component: ListadoEconomicos },
    { path : 'nuevoEconomico', component: NuevoEconomico },
    { path: 'mantenimientos/configuracion-anual-ss', component: ConfiguracionAnualSSComponent },
    { path: 'mantenimientos/tarifa-primas-cnae', component: TarifaPrimasCnaeComponent },
    { path: 'mantenimientos/claves-ocupacion', component: ClavesOcupacionComponent },
    { path: 'economico',
        children: [
            { path: 'ver/:id', component: VerEconomico },
            { path: 'personal/:id', component: PersonalEconomico },
            { path: 'proyectos/:id', component:  ListadoProyectos},
            { path: 'colaboraciones/:id', component: ColaboracionesExternas },
            { path: 'materiales/:id', component: MaterialesFungibles },
            { path: 'asignaciones/:id', component:  Asignaciones},
            { path: 'resumen/:id', component:  ResumenEconomico},
        ]
    },
];
