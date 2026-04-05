// === Enums ===
export enum ValidezIDI {
    VALIDA_IDI = 'VALIDA_IDI',
    VALIDA_PARCIAL = 'VALIDA_PARCIAL',
    NO_VALIDA = 'NO_VALIDA'
}

export enum TipoContratoColaboradorasExternas {
    GASTOS = 'GASTOS',
    COSTE_HORA_PERSONAL = 'COSTE_HORA_PERSONAL'
}

// === Colaboradora ===
export interface ColaboradoraDTO {
    idColaboradora: number;
    cif: string;
    nombre: string;
}

export interface CrearColaboradoraDTO {
    idEconomico: number;
    cif: string;
    nombre: string;
}

export interface ActualizarColaboradoraDTO {
    idColaboradora: number;
    cif?: string;
    nombre?: string;
}

// === Contrato ===
export interface ContratoColaboracionDTO {
    idContrato: number;
    nombreContrato: string;
    objeto: string;
    tipoContrato: TipoContratoColaboradorasExternas;
    validez: ValidezIDI;
    importeCubierto: number;
    idColaboradora: number;
    nombreColaboradora: string;
    totalFacturado: number;
    superaCobertura: boolean;
}

export interface CrearContratoColaboracionDTO {
    idColaboradora: number;
    nombreContrato: string;
    objeto: string;
    tipoContrato: TipoContratoColaboradorasExternas;
    validez: ValidezIDI;
    importeCubierto: number;
}

export interface ActualizarContratoColaboracionDTO {
    idContrato: number;
    nombreContrato?: string;
    objeto?: string;
    tipoContrato?: TipoContratoColaboradorasExternas;
    validez?: ValidezIDI;
    importeCubierto?: number;
}

// === Factura ===
export interface FacturaColaboracionDTO {
    idFactura: number;
    numeroFactura: string;
    conceptos: string;
    importe: number;
    baseImponible: number;
    iva: number;
    porcentajeProrrata: number;
    validez: ValidezIDI;
    porcentajeValidez: number;
    importeFinal: number;
    importeImputable: number;
    idColaboradora: number;
    nombreColaboradora: string;
    idContrato: number | null;
    nombreContrato: string | null;
    idProyecto: number | null;
    acronimoProyecto: string | null;
    imputacionesFase: ImputacionFacturaFaseDTO[];
}

export interface CrearFacturaColaboracionDTO {
    idColaboradora: number;
    numeroFactura: string;
    conceptos: string;
    importe: number;
    baseImponible: number;
    iva: number;
    porcentajeProrrata: number;
    validez: ValidezIDI;
    porcentajeValidez: number;
    idContrato?: number;
    idProyecto?: number;
}

export interface ActualizarFacturaColaboracionDTO {
    idFactura: number;
    numeroFactura?: string;
    conceptos?: string;
    importe?: number;
    baseImponible?: number;
    iva?: number;
    porcentajeProrrata?: number;
    validez?: ValidezIDI;
    porcentajeValidez?: number;
    idContrato?: number;
    idProyecto?: number;
}

// === Imputación a fase ===
export interface ImputacionFacturaFaseDTO {
    id: number;
    idFactura: number;
    idFase: number;
    nombreFase: string;
    importe: number;
}

export interface ActualizarImputacionFacturaFaseDTO {
    idFactura: number;
    idFase: number;
    importe: number;
}

// === Resumen ===
export interface ResumenColaboracionesProyectoDTO {
    idProyecto: number;
    acronimoProyecto: string;
    totalFacturadoImputable: number;
    porFase: ResumenColaboracionesFaseDTO[];
}

export interface ResumenColaboracionesFaseDTO {
    idFase: number;
    nombreFase: string;
    totalImputado: number;
}

export type ColaboracionSavingState = 'idle' | 'saving' | 'success' | 'error';
