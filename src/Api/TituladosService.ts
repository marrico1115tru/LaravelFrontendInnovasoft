import axios from "axios";
import { Titulado } from "@/types/types/typesTitulados";

// BASE URL apuntando al backend Laravel correcto
const API_URL = "http://localhost:8000/api/titulados";

// Configuración global para envío de cookies, incluyendo HttpOnly (se envían automáticamente)
const config = {
  withCredentials: true, // Esto permite que se envíen cookies de sesión incluyendo HttpOnly
};

// Obtener todos los titulados
export const getTitulados = async (): Promise<Titulado[]> => {
  const res = await axios.get(API_URL, config);
  // Laravel usualmente devuelve data dentro de un objeto 'data': { message, data }
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  // En caso de que devuelva el array directamente
  if (Array.isArray(res.data)) return res.data;
  return [];
};

// Crear un nuevo titulado
export const createTitulado = async (
  data: Partial<Titulado>
): Promise<Titulado> => {
  const res = await axios.post(API_URL, data, config);
  return res.data;
};

// Actualizar un titulado
export const updateTitulado = async (
  id: number,
  data: Partial<Titulado>
): Promise<Titulado> => {
  const res = await axios.put(`${API_URL}/${id}`, data, config);
  return res.data;
};

// Eliminar un titulado por ID
export const deleteTitulado = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, config);
};
