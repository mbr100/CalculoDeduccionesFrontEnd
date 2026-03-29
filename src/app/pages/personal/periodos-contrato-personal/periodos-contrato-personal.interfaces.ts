import {ClaveContratoDTO} from '../../../models/personal-economico';

/** Shape of the create/edit form held in formData signal */
export interface FormPeriodoContrato {
    idPersona: number;
    claveContrato: string;
    fechaAlta: string;
    fechaBaja: string;
    porcentajeJornada: number;
    horasConvenio: number;
    // Derived from selected clave — read-only display
    nombrePersona: string;
}

/** Group label -> claves for the grouped select */
export interface GrupoClave {
    label: string;
    claves: ClaveContratoDTO[];
}

