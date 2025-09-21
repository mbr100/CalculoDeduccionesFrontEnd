import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {ActualizarDatosEconomicoDTO, EcnomicoListadoGeneralDto, EconomicoDto, nuevoEconomicoDto} from '../models/economico';
import {Observable} from 'rxjs';
import {PaginacionResponse} from '../models/paginacion-response';

@Injectable({
  providedIn: 'root'
})
export class EconomicoService {
    private baseUrl: string = environment.apiUrl;
    private apiEconomicos: string = environment.apiEconomicos

    constructor(private http: HttpClient) {}

    public getEconomicosListadoGeneral(page: number = 0, size: number = 10): Observable<PaginacionResponse<EcnomicoListadoGeneralDto>> {
        let params = new HttpParams().set('page', page.toString()).set('size', size.toString()).append('sort', 'nombre,asc');
        return this.http.get<PaginacionResponse<EcnomicoListadoGeneralDto>>(`${this.baseUrl}/${this.apiEconomicos}`, { params });
    }

    public eliminarEconomico(economico: EcnomicoListadoGeneralDto): Observable<EcnomicoListadoGeneralDto> {
        console.log("Eliminando economico:", economico);
        return this.http.delete<EcnomicoListadoGeneralDto>(`${this.baseUrl}/${this.apiEconomicos}`, {
            body: economico
        });
    }

    public crearEconomico(data: nuevoEconomicoDto): Observable<EcnomicoListadoGeneralDto> {
        return this.http.post<EcnomicoListadoGeneralDto>(`${this.baseUrl}/${this.apiEconomicos}`, data, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public getEconomicoById(id: number): Observable<EconomicoDto> {
        return this.http.get<EconomicoDto>(`${this.baseUrl}/${this.apiEconomicos}/${id}`);
    }

    public actualizarEconomico(updatedEconomico: ActualizarDatosEconomicoDTO):Observable<EconomicoDto> {
        return this.http.put<EconomicoDto>(`${this.baseUrl}/${this.apiEconomicos}/actualizar`, updatedEconomico, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public resumenGastoProyectoEconomico(idEconomico: number): Observable<any> {
        return this.http.get<any>(`${this.baseUrl}/${this.apiEconomicos}/${idEconomico}/resumen`,{
            headers: {'Content-Type': 'application/json'}
        });
    }
}
