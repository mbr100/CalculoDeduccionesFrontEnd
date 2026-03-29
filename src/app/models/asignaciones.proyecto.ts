export interface ProyectoAsignacionDTO {
    idProyecto: number;
    acronimo: string;
}

export interface FilaAsignacionDTO {
    idPersonal: number;
    nombreCompleto: string;
    horas: number[];
    horasEfectivas: number;
}

export interface MatrizAsignacionesDTO {
    proyectos: ProyectoAsignacionDTO[];
    filas: FilaAsignacionDTO[];
}

export interface ActualizarAsignacionDTO {
    idPersonal: number;
    idProyecto: number;
    horas: number;
}

export type SavingState = 'idle' | 'saving' | 'success' | 'error';
