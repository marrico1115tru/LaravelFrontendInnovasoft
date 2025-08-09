// types/EntregaMaterial.ts

export interface FichaFormacion {
  id: number;
  nombre?: string;
}

export interface Solicitud {
  id: number;
  fechaSolicitud?: string;
  estadoSolicitud?: string;
}

export interface UsuarioResponsable {
  id: number;
  nombre?: string;
  apellido?: string;
  cedula?: string;
  email?: string;
  telefono?: string;
  cargo?: string;
}

export interface EntregaMaterial {
  id?: number;
  fechaEntrega: string;
  observaciones?: string | null;
  idFichaFormacion: number;       // solo ID número
  idSolicitud: number;            // solo ID número
  idUsuarioResponsable: number;   // solo ID número
}
