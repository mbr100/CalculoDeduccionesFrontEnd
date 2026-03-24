export interface EconomicoDto {
    id: number;
    nombre: string;
    cif: string;
    direccion: string;
    telefono: string;
    nombreContacto: string;
    emailContacto: string;
    horasConvenio: number | null;
    urllogo: string;
    urlWeb: string;
    CNAE: string;
    anualidad: number;
    esPyme: boolean;
    descripcionIDI: string;
    presentacionEmpresa: string;
}

export interface EcnomicoListadoGeneralDto {
    id: number;
    nombre: string;
    cif: string;
    cnae: string;
    anualidad: number;
    esPyme: boolean;
}

export interface nuevoEconomicoDto {
    nombre: string;
    cif: string;
    direccion: string;
    telefono: string;
    nombreContacto: string;
    emailContacto: string;
    horasConvenio: number | null;
    urllogo: string;
    urlWeb: string;
    cnae: number;
    anualidad: number;
    esPyme: boolean;
}
export interface EconomicoCreadoDTO {
    id: number;
}

export interface ActualizarDatosEconomicoDTO {
    id: number;
    nombre: string;
    direccion: string;
    telefono: string;
    nombreContacto: string;
    emailContacto: string;
    horasConvenio: number | null;
    urllogo: string;
    urlWeb: string;
    cnae: number;
    esPyme: boolean;
    descripcionIDI: string;
    presentacionEmpresa: string;
}
