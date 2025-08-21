interface PersonalEconomico {
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
}

interface CrearPersonalEconomico {
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
    idEconomico: number;
}

interface RetribucionesPersonalDTO {
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

interface actualizarRetribucionDTO {
    idRetribucion: number;
    campoActualizado: string;
    valor: number;
}

interface actualizarBbccDTO{
    idBbccPersonal: number;
    campoActualizado: string;
    valor: number | null; // Long -> number, puede ser null
}


interface BbccPersonalDTO {
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

interface AltaEjercicioDTO {
    idPersona: number;
    nombre: string;
    dni: string;
    idAltaEjercicio: number;
    fechaAltaEjercicio: Date;
    fechaBajaEjercicio: Date;
    horasConvenioAnual: number;
    horasMaximasAnuales: number;
}

interface actualizarAltaEjercicioDTO {
    idAltaEjercicio: number;
    campoActualizado: keyof AltaEjercicioDTO;
    valor: Date | number;
}

interface BajasLaboralesDTO {
    idPersona: number;
    nombre: string;
    dni: string;
    idBajaLaboral: number;
    fechaInicio: Date;
    fechaFin: Date;
    horasDeBaja: number;
}

interface ListadoPersonalSelectorEconomicoDTO {
    idPersona: number;
    nombre: string;
}

interface CrearBajaLaboralDTO {
    idPersona: number;
    fechaInicio: Date;
    fechaFin: Date;
}

interface ActualizarBajaLaboralDTO {
    idBajaLaboral: number;
    campoActualizado: keyof BajasLaboralesDTO;
    valor: Date | number;
}

