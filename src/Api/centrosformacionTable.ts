// src/Api/centrosformacionTable.ts
import axios from "axios";

const API_URL = "http://127.0.0.1:8000/api/centros-formacion";

export const getCentrosFormacion = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createCentroFormacion = async (data: any) => {
  const response = await axios.post(API_URL, {
    ...data,
    id_municipio: data.idMunicipio.id, // <-- importante
  });
  return response.data;
};

export const updateCentroFormacion = async (id: number, data: any) => {
  const response = await axios.put(`${API_URL}/${id}`, {
    ...data,
    id_municipio: data.idMunicipio.id, // <-- importante
  });
  return response.data;
};

export const deleteCentroFormacion = async (id: number) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
