export interface CategoriaProducto {
  id: number;
  nombre: string;
  unpsc: string | null;
}

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  tipoMateria: string | null;
  fechaVencimiento: string | null;
  idCategoria: CategoriaProducto;
}

export interface ProductoFormValues {
  nombre: string;
  descripcion: string | null;
  tipoMateria?: string | null;
  fechaVencimiento?: string | null;
  idCategoriaId: number;
}

