export interface ActivoAmortizableDTO {
    idActivo: number;
    descripcion: string;
    proveedor: string;
    numeroFactura: string | null;
    valorAdquisicion: number;
    porcentajeAmortizacion: number;
    porcentajeUsoProyecto: number;
    cuotaAmortizacion: number;
    importeImputable: number;
    idEconomico: number;
    idProyecto: number | null;
    acronimoProyecto: string | null;
    imputaciones: ImputacionActivoFaseDTO[];
}

export interface CrearActivoAmortizableDTO {
    idEconomico: number;
    descripcion: string;
    proveedor: string;
    numeroFactura?: string;
    valorAdquisicion: number;
    porcentajeAmortizacion: number;
    porcentajeUsoProyecto: number;
    idProyecto?: number;
}

export interface ActualizarActivoAmortizableDTO {
    idActivo: number;
    descripcion?: string;
    proveedor?: string;
    numeroFactura?: string;
    valorAdquisicion?: number;
    porcentajeAmortizacion?: number;
    porcentajeUsoProyecto?: number;
    idProyecto?: number | null;
    clearProyecto?: boolean;
}

export interface ImputacionActivoFaseDTO {
    id: number;
    idActivo: number;
    idFase: number;
    nombreFase: string;
    importe: number;
}

export interface ActualizarImputacionActivoFaseDTO {
    idActivo: number;
    idFase: number;
    importe: number;
}

export interface ResumenActivoProyectoDTO {
    idProyecto: number;
    acronimoProyecto: string;
    totalImputable: number;
    porFase: ResumenActivoFaseDTO[];
}

export interface ResumenActivoFaseDTO {
    idFase: number;
    nombreFase: string;
    totalImputado: number;
}
