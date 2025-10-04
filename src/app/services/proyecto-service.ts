import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {PaginacionResponse} from '../models/paginacion-response';
import {HttpClient, HttpParams} from '@angular/common/http';
import {ActualizarProyectoDTO, CrearProyectoDTO, Proyecto} from '../models/proyecto-economico';
import {ActualizarAsignacionDTO, MatrizAsignacionesDTO} from '../models/asignaciones.proyecto';

@Injectable({
  providedIn: 'root'
})
export class ProyectoService {
    private baseUrl: string = environment.apiUrl;
    private apiProyectos: string = environment.apiProyectos

    constructor(private http: HttpClient) {}


    public getProyectosByEconomico(idEconomico: number, page: number = 0, size: number = 10): Observable<PaginacionResponse<Proyecto>> {
        const params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        console.log(`${this.baseUrl}${this.apiProyectos}/economico/${idEconomico}`);

        return this.http.get<PaginacionResponse<Proyecto>>(
            `${this.baseUrl}${this.apiProyectos}/economico/${idEconomico}`,
            { params }
        );
    }

    public actualizarProyecto(actualizacion: ActualizarProyectoDTO) {
        return this.http.put(`${this.baseUrl}${this.apiProyectos}`, actualizacion, {
            headers: {'Content-Type': 'application/json'}
        });

    }

    public eliminarProyecto(idProyecto: number) {
        return this.http.delete(`${this.baseUrl}${this.apiProyectos}/${idProyecto}`, {
            headers: {'Content-Type': 'application/json'}
        });

    }

    public crearProyecto(nuevoProyecto: CrearProyectoDTO): Observable<void> {
        return this.http.post<void>(`${this.baseUrl}${this.apiProyectos}`, nuevoProyecto, {
            headers: {'Content-Type': 'application/json'}
        });
    }

    public getAsignacionesPerosnalProyecto(idEconomico: number): Observable<MatrizAsignacionesDTO> {
        return this.http.get<MatrizAsignacionesDTO>(`${this.baseUrl}${this.apiProyectos}/asignaciones/${idEconomico}`);
    }

    public actualizarAsignacion(actualizacion: ActualizarAsignacionDTO) {
        return this.http.put(`${this.baseUrl}${this.apiProyectos}/asignaciones`, actualizacion, {
            headers: {'Content-Type': 'application/json'}
        });

    }
}
