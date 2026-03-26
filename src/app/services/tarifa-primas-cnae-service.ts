import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { CrearTarifaPrimasCnaeDTO, TarifaPrimasCnaeDTO } from '../models/tarifa-primas-cnae';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class TarifaPrimasCnaeService {
    private baseUrl: string = environment.apiUrl;
    private apiPath = 'api/tarifa-primas-cnae';

    constructor(private http: HttpClient) {}

    public listarTodos(anio?: number): Observable<TarifaPrimasCnaeDTO[]> {
        let params = new HttpParams();
        if (anio) {
            params = params.set('anio', anio.toString());
        }
        return this.http.get<TarifaPrimasCnaeDTO[]>(`${this.baseUrl}/${this.apiPath}`, { params });
    }

    public obtenerPorCnaeYAnio(cnae: string, anio: number): Observable<TarifaPrimasCnaeDTO> {
        return this.http.get<TarifaPrimasCnaeDTO>(`${this.baseUrl}/${this.apiPath}/${cnae}/${anio}`);
    }

    public existe(cnae: string, anio: number): Observable<boolean> {
        return this.http.get<boolean>(`${this.baseUrl}/${this.apiPath}/${cnae}/${anio}/existe`);
    }

    public crear(dto: CrearTarifaPrimasCnaeDTO): Observable<TarifaPrimasCnaeDTO> {
        return this.http.post<TarifaPrimasCnaeDTO>(`${this.baseUrl}/${this.apiPath}`, dto, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    public actualizar(id: number, dto: CrearTarifaPrimasCnaeDTO): Observable<TarifaPrimasCnaeDTO> {
        return this.http.put<TarifaPrimasCnaeDTO>(`${this.baseUrl}/${this.apiPath}/${id}`, dto, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    public eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${this.apiPath}/${id}`);
    }
}
