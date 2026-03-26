import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ClaveOcupacionDTO, CrearClaveOcupacionDTO } from '../models/clave-ocupacion';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ClaveOcupacionService {
    private baseUrl: string = environment.apiUrl;
    private apiPath = 'api/claves-ocupacion';

    constructor(private http: HttpClient) {}

    public listarTodos(soloActivas?: boolean): Observable<ClaveOcupacionDTO[]> {
        let params = new HttpParams();
        if (soloActivas) {
            params = params.set('soloActivas', 'true');
        }
        return this.http.get<ClaveOcupacionDTO[]>(`${this.baseUrl}/${this.apiPath}`, { params });
    }

    public crear(dto: CrearClaveOcupacionDTO): Observable<ClaveOcupacionDTO> {
        return this.http.post<ClaveOcupacionDTO>(`${this.baseUrl}/${this.apiPath}`, dto, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    public actualizar(clave: string, dto: CrearClaveOcupacionDTO): Observable<ClaveOcupacionDTO> {
        return this.http.put<ClaveOcupacionDTO>(`${this.baseUrl}/${this.apiPath}/${clave}`, dto, {
            headers: { 'Content-Type': 'application/json' }
        });
    }

    public eliminar(clave: string): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${this.apiPath}/${clave}`);
    }
}
