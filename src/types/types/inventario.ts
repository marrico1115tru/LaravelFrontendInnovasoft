export interface Sitio {
  nombreSitio: string;
  id: number;
  nombre: string;
  ubicacion: string;
}

export interface Producto {
  nombreProducto: any;
  id: number;
  nombre: string;
  descripcion: string;
  tipoMateria: string;
  fechaVencimiento: string | null;
}

export interface Movimiento {
  id: number;
  tipoMovimiento: string;
  cantidad: number;
  fechaMovimiento: string;
}

export interface Inventario {
  [x: string]: any;
  idProductoInventario: number;
  stock: number;
  fkSitio: Sitio;
  idProducto: Producto;
  movimientos: Movimiento[];
}

export interface InventarioFormValues {
  stock: number;
  fkSitioId: number;
  idProductoId: number;
}
