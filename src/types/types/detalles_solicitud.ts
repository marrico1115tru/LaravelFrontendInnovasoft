export interface Producto {
  id: number;
  nombre: string;
}

export interface SolicitudRef {
  id: number;
}

export interface DetalleSolicitud {
  id?: number;
  cantidadSolicitada: number;
  observaciones?: string | null;
  idProducto: Producto;
  idSolicitud: SolicitudRef;
}

export interface DetalleSolicitudPayload {
  cantidadSolicitada: number;
  observaciones?: string | null;
  idProducto: { id: number };
  idSolicitud: { id: number };
}
