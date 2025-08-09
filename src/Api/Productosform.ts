import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/productos";

const config = {
  withCredentials: true,
};

export const getProductos = async () => {
  const res = await axios.get(API_URL, config);
  // Aquí mapeamos para agregar fechaVencimiento y asegurar idCategoria como objeto
  return res.data.map((item: any) => ({
    ...item,
    fechaVencimiento: item.fecha_vencimiento, // mapeo fecha
    idCategoria: item.idCategoria || null, // espera que backend incluya relación
  }));
};

export const createProducto = async (data: any) => {
  const payload = {
    nombre: data.nombre,
    descripcion: data.descripcion || null,
    fecha_vencimiento: data.fechaVencimiento || null,
    id_categoria: data.idCategoriaId,
  };
  const res = await axios.post(API_URL, payload, config);
  return res.data;
};

export const updateProducto = async (id: number, data: any) => {
  const payload = {
    nombre: data.nombre,
    descripcion: data.descripcion || null,
    fecha_vencimiento: data.fechaVencimiento || null,
    id_categoria: data.idCategoriaId,
  };
  const res = await axios.put(`${API_URL}/${id}`, payload, config);
  return res.data;
};

export const deleteProducto = async (id: number) => {
  const res = await axios.delete(`${API_URL}/${id}`, config);
  return res.data;
};
