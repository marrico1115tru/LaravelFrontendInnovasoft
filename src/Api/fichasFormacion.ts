import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/fichas-formacion';

const config = {
  withCredentials: true,
};

// Obtener todas las fichas con relaciones incluidas (titulado, usuario_responsable, etc)
export const getFichasFormacion = async () => {
  const res = await axios.get(API_URL, config);
  return res.data;
};

// Crear ficha enviando solo los IDs planos
export const createFichaFormacion = async (data: any) => {
  const payload = {
    nombre: data.nombre,
    id_titulado: data.id_titulado,
    id_usuario_responsable: data.id_usuario_responsable || null,
  };
  const res = await axios.post(API_URL, payload, config);
  return res.data;
};

// Actualizar ficha
export const updateFichaFormacion = async (id: number, data: any) => {
  const payload = {
    nombre: data.nombre,
    id_titulado: data.id_titulado,
    id_usuario_responsable: data.id_usuario_responsable || null,
  };
  const res = await axios.put(`${API_URL}/${id}`, payload, config);
  return res.data;
};

// Eliminar ficha
export const deleteFichaFormacion = async (id: number) => {
  const res = await axios.delete(`${API_URL}/${id}`, config);
  return res.data;
};
