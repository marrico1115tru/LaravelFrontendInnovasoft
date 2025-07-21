import axios from "axios";
import type { Sede, SedeFormValues } from "@/types/types/Sede";

const API_URL = "http://localhost:8000/api/sedes";

const config = {
  withCredentials: true, // Para enviar cookies HttpOnly junto con la petición
};

// Obtener listado de sedes
export const getSedes = async (): Promise<Sede[]> => {
  const res = await axios.get(API_URL, config);
  // Según tu respuesta backend, los datos están en res.data.data
  if (res.data && Array.isArray(res.data.data)) {
    return res.data.data as Sede[];
  }
  if (Array.isArray(res.data)) {
    return res.data as Sede[];
  }
  return [];
};

// Crear sede
export const createSede = async (data: SedeFormValues): Promise<Sede> => {
  const res = await axios.post(API_URL, data, config);
  return res.data;
};

// Actualizar sede
export const updateSede = async (id: number, data: SedeFormValues): Promise<Sede> => {
  const res = await axios.put(`${API_URL}/${id}`, data, config);
  return res.data;
};

// Eliminar sede
export const deleteSede = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, config);
};
