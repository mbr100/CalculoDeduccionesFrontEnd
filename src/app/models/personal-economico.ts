export interface PersonalEconomico {
    idPersona: number;
    nombre: string;
    apellidos: string;
    dni: string;
    puesto: string;
    departamento: string;
    titulacion1?: string;
    titulacion2?: string;
    titulacion3?: string;
    titulacion4?: string;
    esPersonalInvestigador: boolean;
    esContratoIndefinido: boolean;
    claveOcupacion?: string;
}

export interface CrearPersonalEconomico {
    idPersona: number;
    nombre: string;
    apellidos: string;
    dni: string;
    puesto: string;
    departamento: string;
    titulacion1?: string;
    titulacion2?: string;
    titulacion3?: string;
    titulacion4?: string;
    esPersonalInvestigador: boolean;
    esContratoIndefinido: boolean;
    claveOcupacion?: string;
    idEconomico: number;
}

export interface RetribucionesPersonalDTO {
    idPersonal: number;
    nombre: string;
    dni: string;
    idRetribucion: number;
    importeRetribucionNoIT: number;      // Long -> number
    importeRetribucionExpecie: number;   // Long -> number
    aportacionesPrevencionSocial: number;// Long -> number
    dietasViajeExentas: number;          // Long -> number
    rentasExentas190: number;            // Long -> number
}

export interface actualizarRetribucionDTO {
    idRetribucion: number;
    campoActualizado: string;
    valor: number;
}

export interface actualizarBbccDTO{
    idBbccPersonal: number;
    campoActualizado: string;
    valor: number | null; // Long -> number, puede ser null
}

export interface BbccPersonalDTO {
    idPersonal: number;
    nombre: string;
    dni: string;
    id_baseCotizacion: number;
    basesCotizacionContingenciasComunesEnero: number | null;
    basesCotizacionContingenciasComunesFebrero: number | null;
    basesCotizacionContingenciasComunesMarzo: number | null;
    basesCotizacionContingenciasComunesAbril: number | null;
    basesCotizacionContingenciasComunesMayo: number | null;
    basesCotizacionContingenciasComunesJunio: number | null;
    basesCotizacionContingenciasComunesJulio: number | null;
    basesCotizacionContingenciasComunesAgosto: number | null;
    basesCotizacionContingenciasComunesSeptiembre: number | null;
    basesCotizacionContingenciasComunesOctubre: number | null;
    basesCotizacionContingenciasComunesNoviembre: number | null;
    basesCotizacionContingenciasComunesDiciembre: number | null;
}

export interface AltaEjercicioDTO {
    idPersona: number;
    nombre: string;
    dni: string;
    idAltaEjercicio: number;
    fechaAltaEjercicio: Date;
    fechaBajaEjercicio: Date;
    horasConvenioAnual: number;
    horasMaximasAnuales: number;
}

export interface actualizarAltaEjercicioDTO {
    idAltaEjercicio: number;
    campoActualizado: keyof AltaEjercicioDTO;
    valor: Date | number;
}

export interface BajasLaboralesDTO {
    idPersona: number;
    nombre: string;
    dni: string;
    idBajaLaboral: number;
    fechaInicio: Date;
    fechaFin: Date;
    horasDeBaja: number;
}

export interface ListadoPersonalSelectorEconomicoDTO {
    idPersona: number;
    nombre: string;
}

export interface CrearBajaLaboralDTO {
    idPersona: number;
    fechaInicio: Date;
    fechaFin: Date;
}

export interface ActualizarBajaLaboralDTO {
    idBajaLaboral: number;
    campoActualizado: keyof BajasLaboralesDTO;
    valor: Date | number;
}

export interface BajaPersona {
    idPersona: number;
    fechaInicio: string;  // puedes usar Date si quieres manejarlo como objeto Date
    fechaFin: string;
    nombre: string;
}

export interface BonificacionesEmpleadoEconomicoDTO {
    idPersona: number;
    nombre: string;
    dni: string;
    idBonificacionTrabajador: number;
    tipoBonificacion: TiposBonificacion;
    porcentajeBonificacion: number;
    fechaInicio: string;
    fechaFin: string;
    anioFiscal: number;
    descripcion: string | null;
}

export interface ListadoPersonalSelectorEconomicoDTO {
    idPersona: number;
    nombre: string;
}

export interface CrearBonificacionDTO {
    idPersona: number;
    tipoBonificacion: string;
    porcentajeBonificacion: number;
    fechaInicio: string;
    fechaFin: string;
    anioFiscal: number;
    descripcion: string | null;
}

export interface ActualizarBonificacionDTO {
    idBonificacionTrabajador: number;
    campoActualizado: keyof BonificacionesEmpleadoEconomicoDTO;
    valor: TiposBonificacion | number | string;
}

// Enum para tipos de bonificación
export enum TiposBonificacion {
    BONIFICACION_PERSONAL_INVESTIGADOR = 'BONIFICACION_PERSONAL_INVESTIGADOR',
    OTRA_BONIFICACION = 'OTRA_BONIFICACION'
}

export interface formBonificacion {
    idPersona: number
    tipoBonificacion: TiposBonificacion
    porcentajeBonificacion: number
    nombre: string
    fechaInicio: string
    fechaFin: string
    anioFiscal: number
    descripcion: string
}
export interface tiposBonificacion {
    value: TiposBonificacion
    label: string
    porcentajeDefault: number
}

// === PERÍODOS DE CONTRATO ===

export interface ClaveContratoDTO {
    clave: string;
    descripcion: string;
    naturaleza: NaturalezaContrato;
    jornada: TipoJornada;
    cotizaDesempleo: boolean;
    cotizaFogasa: boolean;
    cotizaFp: boolean;
    cotizaMei: boolean;
    cotizaCcEstandar: boolean;
    vigente: boolean;
}

export type NaturalezaContrato = 'INDEFINIDO' | 'TEMPORAL' | 'FORMACION' | 'BECARIO_REMUNERADO' | 'BECARIO_NO_REMUNERADO';
export type TipoJornada = 'TIEMPO_COMPLETO' | 'TIEMPO_PARCIAL' | 'FIJO_DISCONTINUO';

export interface PeriodoContratoDTO {
    id: number;
    idPersona: number;
    nombre: string;
    dni: string;
    claveContrato: string;
    descripcionContrato: string;
    naturaleza: NaturalezaContrato;
    jornada: TipoJornada;
    fechaAlta: string;
    fechaBaja: string | null;
    anioFiscal: number;
    porcentajeJornada: number;
    baseCcMensual: number;
    baseCpMensual: number;
}

export interface CrearPeriodoContratoDTO {
    idPersona: number;
    claveContrato: string;
    fechaAlta: string;
    fechaBaja: string | null;
    anioFiscal: number;
    porcentajeJornada: number;
    baseCcMensual: number;
    baseCpMensual: number;
}

export interface ActualizarPeriodoContratoDTO {
    id: number;
    claveContrato?: string;
    fechaAlta?: string;
    fechaBaja?: string | null;
    porcentajeJornada?: number;
    baseCcMensual?: number;
    baseCpMensual?: number;
}

export interface CosteHoraPersonalDTO {
    idPersona: number;
    nombre: string;
    dni: string;
    puesto: string;
    titulacion: string | null;
    departamento: string;
    idCosteHoraPersonal: number;
    retribucionTotal: number;
    costeSS: number;
    horasMaximas: number;
    costeHora: number;

    // Desglose de cuotas SS empresa
    cuotaCC: number;
    cuotaATEP: number;
    cuotaDesempleo: number;
    cuotaFogasa: number;
    cuotaFP: number;
    cuotaMEI: number;

    // Trazabilidad AT/EP
    tipoATEPAplicado: number;
    origenTipoATEP: string | null;

    // Bonificaciones SS
    ssEmpresaBruta: number;
    ahorroBonificaciones: number;
    ahorroInvestigador: number;
    ahorroOtrasBonificaciones: number;
}

export interface ActualizarCosteHoraDTO {
    id: number;
    campoActualizado: keyof CosteHoraPersonalDTO;
    valor: number;
}
