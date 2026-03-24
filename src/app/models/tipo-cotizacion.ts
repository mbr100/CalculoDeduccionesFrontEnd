export interface TipoCotizacionDTO {
    id: number;
    cnae: string;
    anualidad: number;
    descripcion: string;
    contingenciasComunes: number;
    accidentesTrabajoIT: number;
    accidentesTrabajoIMS: number;
    accidentesTrabajoTotal: number;
    desempleoIndefinido: number;
    desempleoTemporal: number;
    fogasa: number;
    formacionProfesional: number;
    mei: number;
}

export interface CrearTipoCotizacionDTO {
    cnae: string;
    anualidad: number;
    descripcion: string;
    contingenciasComunes: number;
    accidentesTrabajoIT: number;
    accidentesTrabajoIMS: number;
    desempleoIndefinido: number;
    desempleoTemporal: number;
    fogasa: number;
    formacionProfesional: number;
    mei: number;
}
