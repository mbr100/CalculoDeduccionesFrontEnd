import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../environments/environment';
import {EcnomicoListadoGeneralDto} from '../models/empresa';
import {Observable} from 'rxjs';
import {PaginacionResponse} from '../models/paginacion-response';

@Injectable({
  providedIn: 'root'
})
export class EconomicoService {
    private baseUrl: string = environment.apiUrl;
    private apiEconomicos: string = environment.apiEconomicos

    constructor(private http: HttpClient) {}

    public getEmpresasListadoGeneral(): Observable<PaginacionResponse<EcnomicoListadoGeneralDto>> {
        return this.http.get<PaginacionResponse<EcnomicoListadoGeneralDto>>(`${this.baseUrl}/${this.apiEconomicos}`);
    }

    public eliminarEconomico(economico: EcnomicoListadoGeneralDto): Observable<EcnomicoListadoGeneralDto> {
        console.log("Eliminando economico:", economico);
        return this.http.delete<EcnomicoListadoGeneralDto>(`${this.baseUrl}/${this.apiEconomicos}`, {
            body: economico
        });
    }
}
