import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api/roles';

export const getRoles = async () => {
  const response = await axios.get(BASE_URL);
  // Se espera que cada rol pueda traer usuarios y permisos relacionados si el backend así lo retorna
  return response.data;
};

export const createRol = async (data: any) => {
  // El backend espera nombre_rol, no nombreRol (percibiendo que el campo en migration es nombre_rol)
  const payload = {
    nombre_rol: data.nombreRol || data.nombre_rol,
  };
  const response = await axios.post(BASE_URL, payload);
  return response.data;
};

export const updateRol = async (id: number, data: any) => {
  const payload = {
    nombre_rol: data.nombreRol || data.nombre_rol,
  };
  const response = await axios.put(`${BASE_URL}/${id}`, payload);
  return response.data;
};

export const deleteRol = async (id: number) => {
  const response = await axios.delete(`${BASE_URL}/${id}`);
  return response.data;
};
