import axios from 'axios';
import { Sitio, SitioFormValues } from '@/types/types/Sitio';

const API_URL = 'http://127.0.0.1:8000/api/sitios';

const config = { withCredentials: true };

const mapToBackendPayload = (data: SitioFormValues) => ({
  nombre: data.nombre,
  ubicacion: data.ubicacion,
  estado: data.estado,
  id_area: data.idArea.id,
  id_tipo_sitio: data.idTipoSitio.id,
});

export const getSitios = async (): Promise<Sitio[]> => {
  const res = await axios.get(API_URL, config);
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  if (Array.isArray(res.data)) return res.data;
  return [];
};

export const createSitio = async (data: SitioFormValues): Promise<Sitio> => {
  const payload = mapToBackendPayload(data);
  const res = await axios.post(API_URL, payload, config);
  return res.data;
};

export const updateSitio = async (id: number, data: SitioFormValues): Promise<Sitio> => {
  const payload = mapToBackendPayload(data);
  const res = await axios.put(`${API_URL}/${id}`, payload, config);
  return res.data;
};

export const deleteSitio = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, config);
};
