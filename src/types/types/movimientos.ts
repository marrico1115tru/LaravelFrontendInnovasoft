// types/movimiento.ts
export interface Movimiento {
  id: number;
  id_entrega: number;
  tipo_movimiento: string;
  cantidad: number;
  id_producto_inventario: number;
  fecha_movimiento: string; // YYYY-MM-DD format
  created_at: string;
  updated_at: string;
  entrega?: EntregaMaterial;
  inventario?: Inventario;
}

export interface EntregaMaterial {
  id: number;
  // Agrega aquí los campos específicos de entrega_material
}

export interface Inventario {
  id_producto_inventario: number;
  id_producto: number;
  stock: number;
  // Agrega aquí los campos específicos de inventario
}

export interface CreateMovimientoData {
  id_entrega: number;
  tipo_movimiento: string;
  cantidad: number;
  id_producto_inventario: number;
  fecha_movimiento: string;
}

export interface UpdateMovimientoData {
  id_entrega?: number;
  tipo_movimiento?: string;
  cantidad?: number;
  id_producto_inventario?: number;
  fecha_movimiento?: string;
}

export interface MovimientoResponse {
  data?: Movimiento[];
  message?: string;
}

export interface MovimientoSingleResponse {
  data?: Movimiento;
  message?: string;
}