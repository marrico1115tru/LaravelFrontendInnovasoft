import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/categoria-productos';

// Configuración (ej. para enviar cookies si usas sesión)
const config = {
  withCredentials: true,
};

// Obtener todas las categorías con sus productos (si el backend los incluye en la respuesta)
export const getCategoriasProductos = async () => {
  const res = await axios.get(API_URL, config);
  return res.data;
};

// Crear nueva categoría enviando nombre y unpsc
export const createCategoriaProducto = async (data: { nombre: string; unpsc?: string }) => {
  const payload = {
    nombre: data.nombre,
    unpsc: data.unpsc || undefined,
  };
  const res = await axios.post(API_URL, payload, config);
  return res.data;
};

// Actualizar categoría existente
export const updateCategoriaProducto = async (id: number, data: { nombre: string; unpsc?: string }) => {
  const payload = {
    nombre: data.nombre,
    unpsc: data.unpsc || undefined,
  };
  const res = await axios.put(`${API_URL}/${id}`, payload, config);
  return res.data;
};

// Eliminar categoría por ID
export const deleteCategoriaProducto = async (id: number) => {
  const res = await axios.delete(`${API_URL}/${id}`, config);
  return res.data;
};
