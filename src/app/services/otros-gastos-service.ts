import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {
    FacturaOtrosGastosDTO,
    CrearFacturaOtrosGastosDTO,
    ActualizarFacturaOtrosGastosDTO,
    ImputacionOtrosGastosFaseDTO,
    ActualizarImputacionOtrosGastosFaseDTO,
    ResumenOtrosGastosProyectoDTO,
    ResumenOtrosGastosFaseDTO
} from '../models/otros-gastos';

@Injectable({
    providedIn: 'root'
})
export class OtrosGastosService {
    private baseUrl: string = environment.apiUrl;
    private api: string = environment.apiOtrosGastos;

    constructor(private http: HttpClient) {}

    // ==================== FACTURAS ====================

    getFacturas(idEconomico: number): Observable<FacturaOtrosGastosDTO[]> {
        return this.http.get<FacturaOtrosGastosDTO[]>(`${this.baseUrl}${this.api}/economico/${idEconomico}`);
    }

    getFacturasPorProyecto(idProyecto: number): Observable<FacturaOtrosGastosDTO[]> {
        return this.http.get<FacturaOtrosGastosDTO[]>(`${this.baseUrl}${this.api}/proyecto/${idProyecto}`);
    }

    crearFactura(dto: CrearFacturaOtrosGastosDTO): Observable<FacturaOtrosGastosDTO> {
        return this.http.post<FacturaOtrosGastosDTO>(`${this.baseUrl}${this.api}`, dto);
    }

    actualizarFactura(dto: ActualizarFacturaOtrosGastosDTO): Observable<FacturaOtrosGastosDTO> {
        return this.http.put<FacturaOtrosGastosDTO>(`${this.baseUrl}${this.api}`, dto);
    }

    eliminarFactura(idFactura: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}${this.api}/${idFactura}`);
    }

    // ==================== IMPUTACIONES ====================

    getImputaciones(idFactura: number): Observable<ImputacionOtrosGastosFaseDTO[]> {
        return this.http.get<ImputacionOtrosGastosFaseDTO[]>(`${this.baseUrl}${this.api}/${idFactura}/imputaciones`);
    }

    actualizarImputacion(dto: ActualizarImputacionOtrosGastosFaseDTO): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}${this.api}/imputaciones`, dto);
    }

    // ==================== RESUMEN ====================

    getResumenPorEconomico(idEconomico: number): Observable<ResumenOtrosGastosProyectoDTO[]> {
        return this.http.get<ResumenOtrosGastosProyectoDTO[]>(`${this.baseUrl}${this.api}/resumen/economico/${idEconomico}`);
    }

    getResumenPorFases(idProyecto: number): Observable<ResumenOtrosGastosFaseDTO[]> {
        return this.http.get<ResumenOtrosGastosFaseDTO[]>(`${this.baseUrl}${this.api}/resumen/proyecto/${idProyecto}/fases`);
    }
}
