import axios from "axios";
import { FichaFormacion } from "@/types/types/FichaFormacion";

const API_URL = "http://127.0.0.1:8000/api/fichas-formacion";

const config = { withCredentials: true };

export const getFichasFormacion = async (): Promise<FichaFormacion[]> => {
  try {
    const res = await axios.get(API_URL, config);
    if (res.data && Array.isArray(res.data.data)) return res.data.data;
    if (Array.isArray(res.data)) return res.data;
    return [];
  } catch (error) {
    throw error;
  }
};

export const createFichaFormacion = async (data: Partial<FichaFormacion>): Promise<FichaFormacion> => {
  const res = await axios.post(API_URL, data, config);
  return res.data;
};

export const updateFichaFormacion = async (id: number, data: Partial<FichaFormacion>): Promise<FichaFormacion> => {
  const res = await axios.put(`${API_URL}/${id}`, data, config);
  return res.data;
};

export const deleteFichaFormacion = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, config);
};
