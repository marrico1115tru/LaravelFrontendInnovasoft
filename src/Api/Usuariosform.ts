import axios from "axios";
import { Usuario, UsuarioFormValues } from "@/types/types/Usuario";

// Cambiamos el endpoint a Laravel
const API_URL = "http://127.0.0.1:8000/api/usuarios";

// Configuración para incluir cookies o credenciales si Laravel usa autenticación con sesión
const config = {
  withCredentials: true,
};

// Obtener todos los usuarios
export const getUsuarios = async (): Promise<Usuario[]> => {
  const res = await axios.get(API_URL, config);
  return res.data.data; // Laravel suele envolver en una propiedad `data`
};

// Crear un nuevo usuario
export const createUsuario = async (
  data: UsuarioFormValues
): Promise<Usuario> => {
  const res = await axios.post(API_URL, data, config);
  return res.data.data; // Ajustado al formato Laravel típico
};

// Actualizar un usuario
export const updateUsuario = async (
  id: number,
  data: UsuarioFormValues
): Promise<Usuario> => {
  const res = await axios.put(`${API_URL}/${id}`, data, config);
  return res.data.data;
};

// Eliminar un usuario
export const deleteUsuario = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, config);
};
