import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api/sedes';

export const getSedes = async () => {
  const response = await axios.get(BASE_URL);
  // Response contiene "centro_formacion"
  return response.data;
};

export const createSede = async (data: any) => {
  // Para crear o actualizar, envía el id_centro_formacion directamente
  const payload = {
    nombre: data.nombre,
    ubicacion: data.ubicacion,
    id_centro_formacion: data.id_centro_formacion || data.idCentroFormacion || data.idCentro, // puedes usar idCentro de frontend
  };
  const response = await axios.post(BASE_URL, payload);
  return response.data;
};

export const updateSede = async (id: number, data: any) => {
  const payload = {
    nombre: data.nombre,
    ubicacion: data.ubicacion,
    id_centro_formacion: data.id_centro_formacion || data.idCentroFormacion || data.idCentro,
  };
  const response = await axios.put(`${BASE_URL}/${id}`, payload);
  return response.data;
};

export const deleteSede = async (id: number) => {
  const response = await axios.delete(`${BASE_URL}/${id}`);
  return response.data;
};
