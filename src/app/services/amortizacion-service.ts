import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {
    ActivoAmortizableDTO,
    ActualizarActivoAmortizableDTO,
    ActualizarImputacionActivoFaseDTO,
    CrearActivoAmortizableDTO,
    ImputacionActivoFaseDTO,
    ResumenActivoFaseDTO,
    ResumenActivoProyectoDTO
} from '../models/amortizacion';

@Injectable({
    providedIn: 'root'
})
export class AmortizacionService {
    private baseUrl: string = environment.apiUrl;
    private api: string = environment.apiAmortizacion;

    constructor(private http: HttpClient) {}

    // ==================== ACTIVOS ====================

    getActivos(idEconomico: number): Observable<ActivoAmortizableDTO[]> {
        return this.http.get<ActivoAmortizableDTO[]>(`${this.baseUrl}${this.api}/economico/${idEconomico}`);
    }

    getActivosPorProyecto(idProyecto: number): Observable<ActivoAmortizableDTO[]> {
        return this.http.get<ActivoAmortizableDTO[]>(`${this.baseUrl}${this.api}/proyecto/${idProyecto}`);
    }

    crearActivo(dto: CrearActivoAmortizableDTO): Observable<ActivoAmortizableDTO> {
        return this.http.post<ActivoAmortizableDTO>(`${this.baseUrl}${this.api}`, dto);
    }

    actualizarActivo(dto: ActualizarActivoAmortizableDTO): Observable<ActivoAmortizableDTO> {
        return this.http.put<ActivoAmortizableDTO>(`${this.baseUrl}${this.api}`, dto);
    }

    eliminarActivo(idActivo: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}${this.api}/${idActivo}`);
    }

    // ==================== IMPUTACIONES ====================

    getImputaciones(idActivo: number): Observable<ImputacionActivoFaseDTO[]> {
        return this.http.get<ImputacionActivoFaseDTO[]>(`${this.baseUrl}${this.api}/${idActivo}/imputaciones`);
    }

    actualizarImputacion(dto: ActualizarImputacionActivoFaseDTO): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}${this.api}/imputaciones`, dto);
    }

    // ==================== RESUMEN ====================

    getResumenPorEconomico(idEconomico: number): Observable<ResumenActivoProyectoDTO[]> {
        return this.http.get<ResumenActivoProyectoDTO[]>(`${this.baseUrl}${this.api}/resumen/economico/${idEconomico}`);
    }

    getResumenPorFases(idProyecto: number): Observable<ResumenActivoFaseDTO[]> {
        return this.http.get<ResumenActivoFaseDTO[]>(`${this.baseUrl}${this.api}/resumen/proyecto/${idProyecto}/fases`);
    }
}
