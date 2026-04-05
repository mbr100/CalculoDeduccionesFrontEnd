import { ValidezIDI } from './colaboracion';
export { ValidezIDI };

export interface FacturaMaterialDTO {
    idFactura: number;
    numeroFactura: string;
    proveedor: string;
    descripcion: string;
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
    imputaciones: ImputacionMaterialFaseDTO[];
}

export interface CrearFacturaMaterialDTO {
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

export interface ActualizarFacturaMaterialDTO {
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

export interface ImputacionMaterialFaseDTO {
    id: number;
    idFactura: number;
    idFase: number;
    nombreFase: string;
    importe: number;
}

export interface ActualizarImputacionMaterialFaseDTO {
    idFactura: number;
    idFase: number;
    importe: number;
}

export interface ResumenMaterialProyectoDTO {
    idProyecto: number;
    acronimoProyecto: string;
    totalImputable: number;
    porFase: ResumenMaterialFaseDTO[];
}

export interface ResumenMaterialFaseDTO {
    idFase: number;
    nombreFase: string;
    totalImputado: number;
}
