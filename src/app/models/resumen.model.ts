export interface PartidaGastoDTO {
    tipoGasto: string;
    importe: number;
}

export interface GastoProyectoDetalladoDTO {
    idProyecto: number;
    acronimo: string;
    titulo: string;
    partidas: PartidaGastoDTO[];
    porcentajeDeduccion: number;
    totalDeduccion: number;
    deduccion: number;
    total: number;
}

export interface ActualizarGastoDTO {
    idProyecto: number;
    tipoGasto: string;
    importe: number;
}

export type SavingState = 'idle' | 'saving' | 'success' | 'error';
