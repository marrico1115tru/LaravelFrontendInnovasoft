import axios from 'axios';
import type { Sede, SedeFormValues } from '@/types/types/Sede';

const API_URL = 'http://localhost:8000/api/sedes';

const config = {
  withCredentials: true, // Para cookies/credenciales
};

const mapToBackendPayload = (data: SedeFormValues) => ({
  nombre: data.nombre,
  ubicacion: data.ubicacion,
  id_centro_formacion: data.idCentroFormacion.id, // Mapeo a snake_case y sólo id
});

export const getSedes = async (): Promise<Sede[]> => {
  const res = await axios.get(API_URL, config);
  if (res.data && Array.isArray(res.data.data)) {
    return res.data.data as Sede[];
  }
  if (Array.isArray(res.data)) {
    return res.data as Sede[];
  }
  return [];
};

export const createSede = async (data: SedeFormValues): Promise<Sede> => {
  const payload = mapToBackendPayload(data);
  const res = await axios.post(API_URL, payload, config);
  return res.data;
};

export const updateSede = async (id: number, data: SedeFormValues): Promise<Sede> => {
  const payload = mapToBackendPayload(data);
  const res = await axios.put(`${API_URL}/${id}`, payload, config);
  return res.data;
};

export const deleteSede = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, config);
};
