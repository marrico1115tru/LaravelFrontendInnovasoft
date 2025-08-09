export interface Movimiento {
  id: number;
  id_entrega: number;  // Obligatorio y numérico
  tipo_movimiento: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  id_producto_inventario: number;
  fecha_movimiento: string; // formato YYYY-MM-DD
  created_at: string;
  updated_at: string;
}

// Payload para creación/actualización, id_entrega obligatorio
export interface MovimientoPayload {
  id_entrega: number;
  tipo_movimiento: 'ENTRADA' | 'SALIDA';
  cantidad: number;
  id_producto_inventario: number;
  fecha_movimiento: string; // string
}
