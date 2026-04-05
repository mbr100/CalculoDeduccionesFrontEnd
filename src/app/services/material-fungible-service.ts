import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {
    FacturaMaterialDTO,
    CrearFacturaMaterialDTO,
    ActualizarFacturaMaterialDTO,
    ImputacionMaterialFaseDTO,
    ActualizarImputacionMaterialFaseDTO,
    ResumenMaterialProyectoDTO,
    ResumenMaterialFaseDTO
} from '../models/material-fungible';

@Injectable({
    providedIn: 'root'
})
export class MaterialFungibleService {
    private baseUrl: string = environment.apiUrl;
    private api: string = environment.apiMateriales;

    constructor(private http: HttpClient) {}

    // ==================== FACTURAS ====================

    getFacturas(idEconomico: number): Observable<FacturaMaterialDTO[]> {
        return this.http.get<FacturaMaterialDTO[]>(`${this.baseUrl}${this.api}/economico/${idEconomico}`);
    }

    getFacturasPorProyecto(idProyecto: number): Observable<FacturaMaterialDTO[]> {
        return this.http.get<FacturaMaterialDTO[]>(`${this.baseUrl}${this.api}/proyecto/${idProyecto}`);
    }

    crearFactura(dto: CrearFacturaMaterialDTO): Observable<FacturaMaterialDTO> {
        return this.http.post<FacturaMaterialDTO>(`${this.baseUrl}${this.api}`, dto);
    }

    actualizarFactura(dto: ActualizarFacturaMaterialDTO): Observable<FacturaMaterialDTO> {
        return this.http.put<FacturaMaterialDTO>(`${this.baseUrl}${this.api}`, dto);
    }

    eliminarFactura(idFactura: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}${this.api}/${idFactura}`);
    }

    // ==================== IMPUTACIONES ====================

    getImputaciones(idFactura: number): Observable<ImputacionMaterialFaseDTO[]> {
        return this.http.get<ImputacionMaterialFaseDTO[]>(`${this.baseUrl}${this.api}/${idFactura}/imputaciones`);
    }

    actualizarImputacion(dto: ActualizarImputacionMaterialFaseDTO): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}${this.api}/imputaciones`, dto);
    }

    // ==================== RESUMEN ====================

    getResumenPorEconomico(idEconomico: number): Observable<ResumenMaterialProyectoDTO[]> {
        return this.http.get<ResumenMaterialProyectoDTO[]>(`${this.baseUrl}${this.api}/resumen/economico/${idEconomico}`);
    }

    getResumenPorFases(idProyecto: number): Observable<ResumenMaterialFaseDTO[]> {
        return this.http.get<ResumenMaterialFaseDTO[]>(`${this.baseUrl}${this.api}/resumen/proyecto/${idProyecto}/fases`);
    }
}
