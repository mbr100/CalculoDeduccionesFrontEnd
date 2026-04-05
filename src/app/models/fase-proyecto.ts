import {PartidaGastoDTO} from './resumen.model';

export interface FaseProyectoDTO {
    idFase: number;
    nombre: string;
}

export interface CrearFaseProyectoDTO {
    idProyecto: number;
    nombre: string;
}

export interface ActualizarFaseProyectoDTO {
    idFase: number;
    nombre: string;
}

export interface MatrizAsignacionFasesDTO {
    fases: FaseProyectoDTO[];
    filas: FilaAsignacionFaseDTO[];
}

export interface FilaAsignacionFaseDTO {
    idPersonal: number;
    nombreCompleto: string;
    idProyectoPersonal: number;
    horasAsignadas: number;
    costeHora: number;
    porcentajes: number[];
}

export interface ActualizarAsignacionFaseDTO {
    idProyectoPersonal: number;
    idFase: number;
    porcentajeDedicacion: number;
}

export interface ResumenGastoFaseDTO {
    idFase: number;
    nombreFase: string;
    partidas: PartidaGastoDTO[];
    total: number;
    porcentajeDeduccion: number;
    deduccion: number;
}

export interface ResumenGastoFasePersonaDTO {
    idFase: number;
    nombreFase: string;
    idPersonal: number;
    nombreCompleto: string;
    horasAsignadas: number;
    porcentajeDedicacion: number;
    horasDedicadas: number;
    costeHora: number;
    gastoPersonal: number;
}

export type FaseSavingState = 'idle' | 'saving' | 'success' | 'error';
