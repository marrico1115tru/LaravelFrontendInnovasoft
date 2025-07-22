import axios from "axios";
import { ProductoFormValues, Producto } from "@/types/types/typesProductos";

const API_URL = "http://localhost:8000/api/productos";

const config = {
  withCredentials: true,
};

export const getProductos = async (): Promise<Producto[]> => {
  const res = await axios.get(API_URL, config);
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (Array.isArray(res.data)) return res.data;
  console.warn("getProductos: respuesta inesperada", res.data);
  return [];
};

export const createProducto = async (
  data: ProductoFormValues
): Promise<Producto> => {
  const payload = {
    nombre: data.nombre,
    descripcion: data.descripcion,
    tipo_materia: data.tipoMateria ?? null,
    fecha_vencimiento: data.fechaVencimiento ?? null,
    id_categoria: data.idCategoriaId,
  };
  const res = await axios.post(API_URL, payload, config);
  return res.data;
};

export const updateProducto = async (
  id: number,
  data: ProductoFormValues
): Promise<Producto> => {
  const payload = {
    nombre: data.nombre,
    descripcion: data.descripcion,
    tipo_materia: data.tipoMateria ?? null,
    fecha_vencimiento: data.fechaVencimiento ?? null,
    id_categoria: data.idCategoriaId,
  };
  const res = await axios.put(`${API_URL}/${id}`, payload, config);
  return res.data;
};

export const deleteProducto = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, config);
};
