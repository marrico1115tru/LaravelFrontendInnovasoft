import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000/api/usuarios';

const config = {
  withCredentials: true,
};

// Obtener todos los usuarios con relaciones cargadas (area y rol)
export const getUsuarios = async () => {
  const res = await axios.get(API_URL, config);
  return res.data;
};

// Crear usuario
export const createUsuario = async (data: any) => {
  // Enviar datos planos y referencias por id
  const payload = {
    nombre: data.nombre,
    apellido: data.apellido,
    cedula: data.cedula,
    email: data.email,
    telefono: data.telefono,
    password: data.password,
    id_area: data.id_area, // pasar id_area plano
    id_rol: data.id_rol,   // pasar id_rol plano
  };
  const res = await axios.post(API_URL, payload, config);
  return res.data;
};

// Actualizar usuario
export const updateUsuario = async (id: number, data: any) => {
  const payload: any = {
    nombre: data.nombre,
    apellido: data.apellido,
    cedula: data.cedula,
    email: data.email,
    telefono: data.telefono,
    id_area: data.id_area,
    id_rol: data.id_rol,
  };
  // Solo envía password si existe (opcional en update)
  if (data.password) {
    payload.password = data.password;
  }
  const res = await axios.put(`${API_URL}/${id}`, payload, config);
  return res.data;
};

// Eliminar usuario
export const deleteUsuario = async (id: number) => {
  const res = await axios.delete(`${API_URL}/${id}`, config);
  return res.data;
};
