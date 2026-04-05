import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../environments/environment';
import {
    FaseProyectoDTO,
    CrearFaseProyectoDTO,
    ActualizarFaseProyectoDTO,
    MatrizAsignacionFasesDTO,
    ActualizarAsignacionFaseDTO,
    ResumenGastoFaseDTO,
    ResumenGastoFasePersonaDTO
} from '../models/fase-proyecto';

@Injectable({
    providedIn: 'root'
})
export class FaseProyectoService {
    private baseUrl: string = environment.apiUrl;
    private apiProyectos: string = environment.apiProyectos;

    constructor(private http: HttpClient) {}

    public getFases(idProyecto: number): Observable<FaseProyectoDTO[]> {
        return this.http.get<FaseProyectoDTO[]>(`${this.baseUrl}${this.apiProyectos}/${idProyecto}/fases`);
    }

    public crearFase(idProyecto: number, nombre: string): Observable<FaseProyectoDTO> {
        return this.http.post<FaseProyectoDTO>(
            `${this.baseUrl}${this.apiProyectos}/${idProyecto}/fases`,
            {nombre}
        );
    }

    public actualizarFase(idFase: number, nombre: string): Observable<FaseProyectoDTO> {
        return this.http.put<FaseProyectoDTO>(
            `${this.baseUrl}${this.apiProyectos}/fases/${idFase}`,
            {nombre}
        );
    }

    public eliminarFase(idFase: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}${this.apiProyectos}/fases/${idFase}`);
    }

    public getMatrizAsignacionFases(idProyecto: number): Observable<MatrizAsignacionFasesDTO> {
        return this.http.get<MatrizAsignacionFasesDTO>(
            `${this.baseUrl}${this.apiProyectos}/${idProyecto}/fases/asignaciones`
        );
    }

    public actualizarAsignacionFase(dto: ActualizarAsignacionFaseDTO): Observable<void> {
        return this.http.put<void>(
            `${this.baseUrl}${this.apiProyectos}/fases/asignaciones`,
            dto
        );
    }

    public getResumenGastoFases(idProyecto: number): Observable<ResumenGastoFaseDTO[]> {
        return this.http.get<ResumenGastoFaseDTO[]>(
            `${this.baseUrl}${this.apiProyectos}/${idProyecto}/fases/resumen`
        );
    }

    public getDesgloseFasePersona(idProyecto: number): Observable<ResumenGastoFasePersonaDTO[]> {
        return this.http.get<ResumenGastoFasePersonaDTO[]>(
            `${this.baseUrl}${this.apiProyectos}/${idProyecto}/fases/desglose`
        );
    }
}
