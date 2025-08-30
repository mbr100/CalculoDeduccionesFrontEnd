import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment.development';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {PaginacionResponse} from '../models/paginacion-response';
import {
    actualizarAltaEjercicioDTO, ActualizarBajaLaboralDTO,
    actualizarBbccDTO,
    ActualizarBonificacionDTO, ActualizarCosteHoraDTO,
    actualizarRetribucionDTO,
    AltaEjercicioDTO, BajasLaboralesDTO,
    BbccPersonalDTO, BonificacionesEmpleadoEconomicoDTO, CosteHoraPersonalDTO, CrearBajaLaboralDTO,
    CrearBonificacionDTO,
    CrearPersonalEconomico, ListadoPersonalSelectorEconomicoDTO,
    PersonalEconomico,
    RetribucionesPersonalDTO
} from '../models/personal-economico';

@Injectable({
    providedIn: 'root'
})
export class EconomicoPersonalService {
    private baseUrl: string = environment.apiUrl;
    private apiPersonal = environment.apiPersonal;
    private http: HttpClient = inject(HttpClient)

    public getPersonalByIdEconomico(idEconomico: number, params: { page: string; size: string }): Observable<PaginacionResponse<PersonalEconomico>> {
        return this.http.get<PaginacionResponse<PersonalEconomico>>(`${this.baseUrl}/${this.apiPersonal}/economico/${idEconomico}`, {params});
    }

    public crearPersonal(crearPersonalEconomico: CrearPersonalEconomico): Observable<PersonalEconomico> {
        return this.http.post<PersonalEconomico>(`${this.baseUrl}/${this.apiPersonal}/economico/crear`, crearPersonalEconomico, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public eliminarPersonal(idEconomico: number, idPersona: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${this.apiPersonal}/${idEconomico}/${idPersona}`, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public actualizarPersonalEconomico(personalactualizar: CrearPersonalEconomico): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${this.apiPersonal}/actualizar`, personalactualizar, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public obtenerRetribucionesPorIdEconomico(idEconomico: number, paginaActual: number, tamano: number): Observable<PaginacionResponse<RetribucionesPersonalDTO>> {
        return this.http.get<PaginacionResponse<RetribucionesPersonalDTO>>(`${this.baseUrl}/${this.apiPersonal}/${idEconomico}/retribuciones`, {
            headers: {'Content-Type': 'application/json'},
            params: {
                page: paginaActual.toString(),
                size: tamano.toString()
            }
        });
    }

    public obtemerBbccPersonalPorIdEconomico(idEconomico: number): Observable<PaginacionResponse<BbccPersonalDTO>> {
        return this.http.get<PaginacionResponse<BbccPersonalDTO>>(`${this.baseUrl}/${this.apiPersonal}/${idEconomico}/cotizaciones`, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public actualizarRetribucion(retribucion: actualizarRetribucionDTO): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${this.apiPersonal}/retribucion`, retribucion, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public actualizarBBCC(bbcc: actualizarBbccDTO): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${this.apiPersonal}/bbcc`, bbcc, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public getAltaPersonalEconomico(idEconomico: number): Observable<PaginacionResponse<AltaEjercicioDTO>> {
        return this.http.get<PaginacionResponse<AltaEjercicioDTO>>(`${this.baseUrl}/${this.apiPersonal}/${idEconomico}/alta-ejercicio`, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public actualizarAltaEjercicio(actualizacion: actualizarAltaEjercicioDTO) {
        return this.http.put<void>(`${this.baseUrl}/${this.apiPersonal}/alta-ejercicio`, actualizacion, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public obtenerBajasLaboralesPorIdEconomico(idEconomico: number, paginaActual: number, tamano: number): Observable<PaginacionResponse<BajasLaboralesDTO>> {
        return this.http.get<PaginacionResponse<BajasLaboralesDTO>>(`${this.baseUrl}/${this.apiPersonal}/${idEconomico}/bajas-laborales`, {
            headers: {'Content-Type': 'application/json'},
            params: {
                page: paginaActual.toString(),
                size: tamano.toString()
            }
        });

    }

    public obtenerListadoPersonalSelector(idEconomico: number): Observable<ListadoPersonalSelectorEconomicoDTO[]> {
        return this.http.get<ListadoPersonalSelectorEconomicoDTO[]>(`${this.baseUrl}/${this.apiPersonal}/selector/${idEconomico}`, {
            headers: {'Content-Type': 'application/json'}

        });

    }

    public actualizarBajaLaboral(actualizacion: ActualizarBajaLaboralDTO): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${this.apiPersonal}/baja-laboral`, actualizacion, {
            headers: {'Content-Type': 'application/json'}
        });

    }

    public eliminarBajaLaboral(idBajaLaboral: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${this.apiPersonal}/baja-laboral/${idBajaLaboral}`, {
            headers: {'Content-Type': 'application/json'}
        });

    }

    public crearBajaLaboral(nuevaBaja: CrearBajaLaboralDTO): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}/${this.apiPersonal}/baja-laboral`, nuevaBaja, {
            headers: {'Content-Type': 'application/json'}
        });

    }

    public obtenerBonificacionesPorIdEconomico(idEconomico: number): Observable<PaginacionResponse<BonificacionesEmpleadoEconomicoDTO>> {
        return this.http.get<PaginacionResponse<BonificacionesEmpleadoEconomicoDTO>>(`${this.baseUrl}/${this.apiPersonal}/${idEconomico}/bonificaciones`, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public actualizarBonificacion(actualizacion: ActualizarBonificacionDTO) {
        return this.http.put<void>(`${this.baseUrl}/${this.apiPersonal}/bonificacion`, actualizacion, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public eliminarBonificacion(idBonificacionTrabajador: number) {
        return this.http.delete<void>(`${this.baseUrl}/${this.apiPersonal}/bonificacion/${idBonificacionTrabajador}`, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public crearBonificacion(nuevaBonificacion: CrearBonificacionDTO) {
        return this.http.post<void>(`${this.baseUrl}/${this.apiPersonal}/bonificacion`, nuevaBonificacion, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public obtenerCosteHoraPorIdEconomico(idEconomico: number) {
        return this.http.get<PaginacionResponse<CosteHoraPersonalDTO>>(`${this.baseUrl}/${this.apiPersonal}/${idEconomico}/resumen-coste-personal`, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    actualizarCosteHora(actualizacion: ActualizarCosteHoraDTO) {
        return this.http.put<void>(`${this.baseUrl}/${this.apiPersonal}/coste-hora`, actualizacion, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    recalcularCostesHora(idEconomico: number) {
        return this.http.post<void>(`${this.baseUrl}/${this.apiPersonal}/${idEconomico}/recalcular-costes`, {}, {
            headers: {'Content-Type': 'application/json'}
        });

    }
}
