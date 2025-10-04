// Interfaces específicas para proyectos
export interface Proyecto {
    idProyecto?: number;
    acronimo: string;
    titulo: string;
    fechaInicio: string; // ISO date string
    fechaFin: string; // ISO date string
    estrategia: Estrategia;
    calificacion: Calificacion;
}

export enum Estrategia {
    AUTOLIQUIDATIVO = 'AUTOLIQUIDATIVO',
    CERTIFICACION = 'CERTIFICACION',
    IMV = 'IMV'
}

export enum Calificacion {
    IT = 'IT',
    I_MAS_D = 'I_MAS_D',
    I_MAS_D_MAS_I = 'I_MAS_D_MAS_I',
    NADA = 'NADA'
}

// DTOs específicos para proyectos
export interface CrearProyectoDTO {
    idEconomico: number;
    acronimo: string;
    titulo: string;
    fechaInicio: Date;
    fechaFin: Date;
    estrategia: Estrategia;
    calificacion: Calificacion;
}

export interface ActualizarProyectoDTO {
    id: number;
    campoActualizado: keyof Proyecto;
    valor: any;
}

export interface FormProyecto {
    acronimo: string;
    titulo: string;
    fechaInicio: string;
    fechaFin: string;
    estrategia: Estrategia | '';
    calificacion: Calificacion | '';
}
