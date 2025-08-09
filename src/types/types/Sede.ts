import { CentroFormacion } from './typesCentroFormacion';

export interface Sede {
  id: number;
  nombre: string | null;
  ubicacion: string | null;
  idCentroFormacion: CentroFormacion; // Objeto con detalle del centro
}

export interface SedeFormValues {
  nombre: string;
  ubicacion: string;
  idCentroFormacion: {
    id: number; // Solo el ID necesario para enviar
  };
}
