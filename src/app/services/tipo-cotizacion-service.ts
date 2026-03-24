import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CrearTipoCotizacionDTO, TipoCotizacionDTO } from '../models/tipo-cotizacion';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TipoCotizacionService {
    private baseUrl: string = environment.apiUrl;
    private apiPath = 'api/tipos-cotizacion';

    constructor(private http: HttpClient) {}

    public listarTodos(anualidad?: number): Observable<TipoCotizacionDTO[]> {
        let params = new HttpParams();
        if (anualidad) {
            params = params.set('anualidad', anualidad.toString());
        }
        return this.http.get<TipoCotizacionDTO[]>(`${this.baseUrl}/${this.apiPath}`, { params });
    }

    public obtenerPorCnaeYAnualidad(cnae: string, anualidad: number): Observable<TipoCotizacionDTO> {
        return this.http.get<TipoCotizacionDTO>(`${this.baseUrl}/${this.apiPath}/${cnae}/${anualidad}`);
    }

    public existe(cnae: string, anualidad: number): Observable<boolean> {
        return this.http.get<boolean>(`${this.baseUrl}/${this.apiPath}/${cnae}/${anualidad}/existe`);
    }

    public crear(dto: CrearTipoCotizacionDTO): Observable<TipoCotizacionDTO> {
        return this.http.post<TipoCotizacionDTO>(`${this.baseUrl}/${this.apiPath}`, dto, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    public actualizar(id: number, dto: CrearTipoCotizacionDTO): Observable<TipoCotizacionDTO> {
        return this.http.put<TipoCotizacionDTO>(`${this.baseUrl}/${this.apiPath}/${id}`, dto, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    public eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${this.apiPath}/${id}`);
    }
}
