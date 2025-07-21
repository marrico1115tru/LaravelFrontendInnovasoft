import axios from 'axios';
import { Rol, RolFormValues } from '@/types/types/Rol';

const API_URL = 'http://127.0.0.1:8000/api/roles';

const config = {
  withCredentials: true,
};

export const getRoles = async (): Promise<Rol[]> => {
  const res = await axios.get(API_URL, config);
  return res.data.data.map((r: any) => ({
    ...r,
    nombreRol: r.nombre_rol, // ✅ transformación para el frontend
  }));
};

export const createRol = async (data: RolFormValues): Promise<Rol> => {
  const res = await axios.post(API_URL, { nombre_rol: data.nombreRol }, config);
  return { ...res.data, nombreRol: res.data.nombre_rol };
};

export const updateRol = async (id: number, data: RolFormValues): Promise<Rol> => {
  const res = await axios.put(`${API_URL}/${id}`, { nombre_rol: data.nombreRol }, config);
  return { ...res.data, nombreRol: res.data.nombre_rol };
};

export const deleteRol = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, config);
};
