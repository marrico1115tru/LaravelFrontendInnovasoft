import axios from 'axios';
import { Municipio } from '@/types/types/typesMunicipio';

const API_URL = 'http://localhost:8000/api/municipios'; // Cambiado al endpoint correcto

const config = {
  withCredentials: true,
};

export const obtenerMunicipios = async (): Promise<Municipio[]> => {
  const res = await axios.get(API_URL, config);
  if (Array.isArray(res.data?.data)) return res.data.data;
  // Si tu API responde listado directamente en res.data, cambia a: return res.data;
  console.warn('obtenerMunicipios: respuesta inesperada', res.data);
  return [];
};

export const crearMunicipio = async (
  municipio: Omit<Municipio, 'id'>
): Promise<Municipio> => {
  const res = await axios.post(API_URL, municipio, config);
  return res.data;
};

export const actualizarMunicipio = async (
  id: number,
  municipio: Omit<Municipio, 'id'>
): Promise<Municipio> => {
  const res = await axios.put(`${API_URL}/${id}`, municipio, config);
  return res.data;
};

export const eliminarMunicipio = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, config);
};
