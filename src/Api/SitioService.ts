// src/Api/SitioService.ts
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/sitios';

export const getSitios = async () => {
  const res = await axios.get(API_URL);
  return res.data; // Debe traer area y tipo_sitio como objetos completos si el backend está bien.
};

export const createSitio = async (data: any) => {
  // Espera data con { nombre, ubicacion, estado, id_area, id_tipo_sitio }
  const payload = {
    nombre: data.nombre,
    ubicacion: data.ubicacion,
    estado: data.estado,
    id_area: data.id_area,
    id_tipo_sitio: data.id_tipo_sitio,
  };
  const res = await axios.post(API_URL, payload);
  return res.data;
};

export const updateSitio = async (id: number, data: any) => {
  const payload = {
    nombre: data.nombre,
    ubicacion: data.ubicacion,
    estado: data.estado,
    id_area: data.id_area,
    id_tipo_sitio: data.id_tipo_sitio,
  };
  const res = await axios.put(`${API_URL}/${id}`, payload);
  return res.data;
};

export const deleteSitio = async (id: number) => {
  const res = await axios.delete(`${API_URL}/${id}`);
  return res.data;
};
