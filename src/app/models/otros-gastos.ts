import { ValidezIDI } from './colaboracion';
export { ValidezIDI };

export interface FacturaOtrosGastosDTO {
    idFactura: number;
    numeroFactura: string;
    proveedor: string;
    descripcion: string | null;
    baseImponible: number;
    iva: number;
    porcentajeProrrata: number;
    validez: ValidezIDI;
    porcentajeValidez: number;
    importeFinal: number;
    importeImputable: number;
    idEconomico: number;
    idProyecto: number | null;
    acronimoProyecto: string | null;
    imputaciones: ImputacionOtrosGastosFaseDTO[];
}

export interface CrearFacturaOtrosGastosDTO {
    idEconomico: number;
    numeroFactura: string;
    proveedor: string;
    descripcion: string;
    baseImponible: number;
    iva: number;
    porcentajeProrrata: number;
    validez: ValidezIDI;
    porcentajeValidez: number;
    idProyecto?: number;
}

export interface ActualizarFacturaOtrosGastosDTO {
    idFactura: number;
    numeroFactura?: string;
    proveedor?: string;
    descripcion?: string;
    baseImponible?: number;
    iva?: number;
    porcentajeProrrata?: number;
    validez?: ValidezIDI;
    porcentajeValidez?: number;
    idProyecto?: number | null;
    clearProyecto?: boolean;
}

export interface ImputacionOtrosGastosFaseDTO {
    id: number;
    idFactura: number;
    idFase: number;
    nombreFase: string;
    importe: number;
}

export interface ActualizarImputacionOtrosGastosFaseDTO {
    idFactura: number;
    idFase: number;
    importe: number;
}

export interface ResumenOtrosGastosProyectoDTO {
    idProyecto: number;
    acronimoProyecto: string;
    totalImputable: number;
    porFase: ResumenOtrosGastosFaseDTO[];
}

export interface ResumenOtrosGastosFaseDTO {
    idFase: number;
    nombreFase: string;
    totalImputado: number;
}
