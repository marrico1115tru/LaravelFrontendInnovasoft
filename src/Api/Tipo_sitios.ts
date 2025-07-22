import axios from 'axios';
import { TipoSitio, TipoSitioFormValues } from '@/types/types/tipo_sitios';

const API_URL = 'http://127.0.0.1:8000/api/tipo-sitio';

const config = { withCredentials: true };

export const getTiposSitio = async (): Promise<TipoSitio[]> => {
  const res = await axios.get(API_URL, config);
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (Array.isArray(res.data)) return res.data;
  return [];
};

export const createTipoSitio = async (data: TipoSitioFormValues): Promise<TipoSitio> => {
  const res = await axios.post(API_URL, data, config);
  return res.data;
};

export const updateTipoSitio = async (id: number, data: TipoSitioFormValues): Promise<TipoSitio> => {
  const res = await axios.put(`${API_URL}/${id}`, data, config);
  return res.data;
};

export const deleteTipoSitio = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, config);
};
