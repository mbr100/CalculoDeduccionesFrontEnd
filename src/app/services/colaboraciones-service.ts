import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {
    ColaboradoraDTO,
    CrearColaboradoraDTO,
    ActualizarColaboradoraDTO,
    ContratoColaboracionDTO,
    CrearContratoColaboracionDTO,
    ActualizarContratoColaboracionDTO,
    FacturaColaboracionDTO,
    CrearFacturaColaboracionDTO,
    ActualizarFacturaColaboracionDTO,
    ImputacionFacturaFaseDTO,
    ActualizarImputacionFacturaFaseDTO,
    ResumenColaboracionesProyectoDTO,
    ResumenColaboracionesFaseDTO
} from '../models/colaboracion';

@Injectable({
    providedIn: 'root'
})
export class ColaboracionesService {
    private baseUrl: string = environment.apiUrl;
    private api: string = environment.apiColaboraciones;

    constructor(private http: HttpClient) {}

    // ==================== COLABORADORAS ====================

    getColaboradoras(idEconomico: number): Observable<ColaboradoraDTO[]> {
        return this.http.get<ColaboradoraDTO[]>(`${this.baseUrl}${this.api}/economico/${idEconomico}`);
    }

    crearColaboradora(dto: CrearColaboradoraDTO): Observable<ColaboradoraDTO> {
        return this.http.post<ColaboradoraDTO>(`${this.baseUrl}${this.api}`, dto);
    }

    actualizarColaboradora(dto: ActualizarColaboradoraDTO): Observable<ColaboradoraDTO> {
        return this.http.put<ColaboradoraDTO>(`${this.baseUrl}${this.api}`, dto);
    }

    eliminarColaboradora(idColaboradora: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}${this.api}/${idColaboradora}`);
    }

    // ==================== CONTRATOS ====================

    getContratos(idEconomico: number): Observable<ContratoColaboracionDTO[]> {
        return this.http.get<ContratoColaboracionDTO[]>(`${this.baseUrl}${this.api}/contratos/economico/${idEconomico}`);
    }

    getContratosPorColaboradora(idColaboradora: number): Observable<ContratoColaboracionDTO[]> {
        return this.http.get<ContratoColaboracionDTO[]>(`${this.baseUrl}${this.api}/contratos/colaboradora/${idColaboradora}`);
    }

    crearContrato(dto: CrearContratoColaboracionDTO): Observable<ContratoColaboracionDTO> {
        return this.http.post<ContratoColaboracionDTO>(`${this.baseUrl}${this.api}/contratos`, dto);
    }

    actualizarContrato(dto: ActualizarContratoColaboracionDTO): Observable<ContratoColaboracionDTO> {
        return this.http.put<ContratoColaboracionDTO>(`${this.baseUrl}${this.api}/contratos`, dto);
    }

    eliminarContrato(idContrato: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}${this.api}/contratos/${idContrato}`);
    }

    // ==================== FACTURAS ====================

    getFacturas(idEconomico: number): Observable<FacturaColaboracionDTO[]> {
        return this.http.get<FacturaColaboracionDTO[]>(`${this.baseUrl}${this.api}/facturas/economico/${idEconomico}`);
    }

    getFacturasPorColaboradora(idColaboradora: number): Observable<FacturaColaboracionDTO[]> {
        return this.http.get<FacturaColaboracionDTO[]>(`${this.baseUrl}${this.api}/facturas/colaboradora/${idColaboradora}`);
    }

    getFacturasPorProyecto(idProyecto: number): Observable<FacturaColaboracionDTO[]> {
        return this.http.get<FacturaColaboracionDTO[]>(`${this.baseUrl}${this.api}/facturas/proyecto/${idProyecto}`);
    }

    getFacturasPorContrato(idContrato: number): Observable<FacturaColaboracionDTO[]> {
        return this.http.get<FacturaColaboracionDTO[]>(`${this.baseUrl}${this.api}/facturas/contrato/${idContrato}`);
    }

    crearFactura(dto: CrearFacturaColaboracionDTO): Observable<FacturaColaboracionDTO> {
        return this.http.post<FacturaColaboracionDTO>(`${this.baseUrl}${this.api}/facturas`, dto);
    }

    actualizarFactura(dto: ActualizarFacturaColaboracionDTO): Observable<FacturaColaboracionDTO> {
        return this.http.put<FacturaColaboracionDTO>(`${this.baseUrl}${this.api}/facturas`, dto);
    }

    eliminarFactura(idFactura: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}${this.api}/facturas/${idFactura}`);
    }

    // ==================== IMPUTACIONES ====================

    getImputaciones(idFactura: number): Observable<ImputacionFacturaFaseDTO[]> {
        return this.http.get<ImputacionFacturaFaseDTO[]>(`${this.baseUrl}${this.api}/facturas/${idFactura}/imputaciones`);
    }

    actualizarImputacion(dto: ActualizarImputacionFacturaFaseDTO): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}${this.api}/facturas/imputaciones`, dto);
    }

    // ==================== RESUMEN ====================

    getResumenPorEconomico(idEconomico: number): Observable<ResumenColaboracionesProyectoDTO[]> {
        return this.http.get<ResumenColaboracionesProyectoDTO[]>(`${this.baseUrl}${this.api}/resumen/economico/${idEconomico}`);
    }

    getResumenPorFases(idProyecto: number): Observable<ResumenColaboracionesFaseDTO[]> {
        return this.http.get<ResumenColaboracionesFaseDTO[]>(`${this.baseUrl}${this.api}/resumen/proyecto/${idProyecto}/fases`);
    }
}
