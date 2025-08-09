export interface Sitio {
  id: number;
  nombre: string | null;
  ubicacion: string | null;
  idArea: {
    id: number;
    nombreArea: string;
  };
  idTipoSitio: {
    id: number;
    nombre: string;
  };
}

export interface SitioFormValues {
  estado: any;
  nombre: string;
  ubicacion: string;
  idArea: {
    id: number;
  };
  idTipoSitio: {
    id: number;
  };
}
