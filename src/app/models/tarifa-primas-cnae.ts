export interface TarifaPrimasCnaeDTO {
    id: number;
    cnae: string;
    anio: number;
    descripcion: string;
    tipoIt: number;
    tipoIms: number;
    tipoTotal: number;
    versionCnae: string;
}

export interface CrearTarifaPrimasCnaeDTO {
    cnae: string;
    anio: number;
    descripcion: string;
    tipoIt: number;
    tipoIms: number;
    versionCnae?: string;
}
