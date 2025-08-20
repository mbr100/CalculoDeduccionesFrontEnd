import {inject, Injectable} from '@angular/core';
import {environment} from '../../environments/environment.development';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {PaginacionResponse} from '../models/paginacion-response';

@Injectable({
  providedIn: 'root'
})
export class EconomicoPersonalService {
    private baseUrl: string = environment.apiUrl;
    private apiPersonal = environment.apiPersonal;
    private http: HttpClient = inject(HttpClient)

    public getPersonalByIdEconomico(idEconomico: number, params: { page: string; size: string }): Observable<PaginacionResponse<PersonalEconomico>> {
        return this.http.get<PaginacionResponse<PersonalEconomico>>(`${this.baseUrl}/${this.apiPersonal}/economico/${idEconomico}`, {params});
    }

    public crearPersonal(crearPersonalEconomico: CrearPersonalEconomico): Observable<PersonalEconomico> {
        return this.http.post<PersonalEconomico>(`${this.baseUrl}/${this.apiPersonal}/economico/crear`, crearPersonalEconomico, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public eliminarPersonal(idEconomico: number,idPersona: number):Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/${this.apiPersonal}/${idEconomico}/${idPersona}`, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public actualizarPersonalEconomico(personalactualizar: CrearPersonalEconomico):Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${this.apiPersonal}/actualizar`, personalactualizar, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public obtenerRetribucionesPorIdEconomico(idEconomico: number, paginaActual:number, tamano:number): Observable<PaginacionResponse<RetribucionesPersonalDTO>> {
        return this.http.get<PaginacionResponse<RetribucionesPersonalDTO>>(`${this.baseUrl}/${this.apiPersonal}/${idEconomico}/retribuciones`, {
            headers: {'Content-Type': 'application/json'},
            params: {
                page: paginaActual.toString(),
                size: tamano.toString()
            }
        });
    }

    public obtemerBbccPersonalPorIdEconomico(idEconomico: number): Observable<PaginacionResponse<BbccPersonalDTO>> {
        return this.http.get<PaginacionResponse<BbccPersonalDTO>>(`${this.baseUrl}/${this.apiPersonal}/${idEconomico}/cotizaciones`, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public actualizarRetribucion(retribucion: actualizarRetribucionDTO): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${this.apiPersonal}/retribucion`, retribucion, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public actualizarBBCC(bbcc: actualizarBbccDTO): Observable<void> {
        return this.http.put<void>(`${this.baseUrl}/${this.apiPersonal}/bbcc`, bbcc, {
            headers: {'Content-Type': 'application/json'}
        });
    }

}
