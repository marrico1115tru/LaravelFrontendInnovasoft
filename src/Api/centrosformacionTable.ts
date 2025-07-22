import axios from 'axios';
import { CentroFormacion, CentroFormacionFormValues } from '@/types/types/typesCentroFormacion';

const API_URL = 'http://localhost:8000/api/centros-formacion';

const config = {
  withCredentials: true,
};

// Función para transformar el payload con idMunicipio a formato backend con id_municipio llano
const mapToBackendPayload = (data: CentroFormacionFormValues) => ({
  nombre: data.nombre,
  ubicacion: data.ubicacion,
  telefono: data.telefono,
  email: data.email,
  id_municipio: data.idMunicipio.id,
});

export const getCentrosFormacion = async (): Promise<CentroFormacion[]> => {
  const res = await axios.get(API_URL, config);
  if (Array.isArray(res.data?.data)) return res.data.data;
  console.warn('getCentrosFormacion: respuesta inesperada:', res.data);
  return [];
};

export const createCentroFormacion = async (
  data: CentroFormacionFormValues
): Promise<CentroFormacion> => {
  const payload = mapToBackendPayload(data);
  const res = await axios.post(API_URL, payload, config);
  return res.data;
};

export const updateCentroFormacion = async (
  id: number,
  data: CentroFormacionFormValues
): Promise<CentroFormacion> => {
  const payload = mapToBackendPayload(data);
  const res = await axios.put(`${API_URL}/${id}`, payload, config);
  return res.data;
};

export const deleteCentroFormacion = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, config);
};
