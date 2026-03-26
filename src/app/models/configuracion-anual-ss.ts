export interface ConfiguracionAnualSSDTO {
    id: number;
    anio: number;
    ccEmpresa: number;
    ccTrabajador: number;
    desempleoEmpresaIndefinido: number;
    desempleoEmpresaTemporal: number;
    fogasa: number;
    fpEmpresa: number;
    meiEmpresa: number;
    meiTrabajador: number;
}

export interface CrearConfiguracionAnualSSDTO {
    anio: number;
    ccEmpresa: number;
    ccTrabajador: number;
    desempleoEmpresaIndefinido: number;
    desempleoEmpresaTemporal: number;
    fogasa: number;
    fpEmpresa: number;
    meiEmpresa: number;
    meiTrabajador: number;
}
