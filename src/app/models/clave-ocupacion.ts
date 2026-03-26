export interface ClaveOcupacionDTO {
    clave: string;
    descripcion: string;
    tipoIt: number;
    tipoIms: number;
    tipoTotal: number;
    activa: boolean;
}

export interface CrearClaveOcupacionDTO {
    clave: string;
    descripcion: string;
    tipoIt: number;
    tipoIms: number;
    activa?: boolean;
}
