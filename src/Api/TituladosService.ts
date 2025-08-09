import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8000/api/titulados';

export const getTitulados = async () => {
  const response = await axios.get(BASE_URL);
  return response.data;
};

export const createTitulado = async (data: { nombre: string }) => {
  const response = await axios.post(BASE_URL, data);
  return response.data;
};

export const updateTitulado = async (id: number, data: { nombre: string }) => {
  const response = await axios.put(`${BASE_URL}/${id}`, data);
  return response.data;
};

export const deleteTitulado = async (id: number) => {
  const response = await axios.delete(`${BASE_URL}/${id}`);
  return response.data;
};
