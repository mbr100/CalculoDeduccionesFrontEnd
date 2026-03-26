import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ConfiguracionAnualSSDTO, CrearConfiguracionAnualSSDTO } from '../models/configuracion-anual-ss';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ConfiguracionAnualSSService {
    private baseUrl: string = environment.apiUrl;
    private apiPath = 'api/configuracion-anual-ss';

    constructor(private http: HttpClient) {}

    public listarTodos(): Observable<ConfiguracionAnualSSDTO[]> {
        return this.http.get<ConfiguracionAnualSSDTO[]>(`${this.baseUrl}/${this.apiPath}`);
    }

    public obtenerPorAnio(anio: number): Observable<ConfiguracionAnualSSDTO> {
        return this.http.get<ConfiguracionAnualSSDTO>(`${this.baseUrl}/${this.apiPath}/${anio}`);
    }

    public crear(dto: CrearConfiguracionAnualSSDTO): Observable<ConfiguracionAnualSSDTO> {
        return this.http.post<ConfiguracionAnualSSDTO>(`${this.baseUrl}/${this.apiPath}`, dto, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    public actualizar(id: number, dto: CrearConfiguracionAnualSSDTO): Observable<ConfiguracionAnualSSDTO> {
        return this.http.put<ConfiguracionAnualSSDTO>(`${this.baseUrl}/${this.apiPath}/${id}`, dto, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    public eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${this.apiPath}/${id}`);
    }
}
