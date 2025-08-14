// src/types.ts
export interface Solicitud {
  id: number;
  nombre?: string;
  fecha?: string;
}

export interface Producto {
  id: number;
  nombre: string;
}

export interface DetalleSolicitud {
  id: number;
  id_solicitud: number;
  id_producto: number;
  cantidad_solicitada: number;
  observaciones?: string;
  created_at: string;
  updated_at: string;

  solicitud: Solicitud;
  producto: Producto;
}
