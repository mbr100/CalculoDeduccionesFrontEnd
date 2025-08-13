export interface EconomicoDto {
    id: number;
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
}

export interface EcnomicoListadoGeneralDto {
    id: number;
    nombre: string;
    cif: string;
    cnae: string;
    anualidad: number;
    esPyme: boolean;
}
