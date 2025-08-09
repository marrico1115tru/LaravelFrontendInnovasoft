import axios from 'axios';

// Configura Axios por defecto
const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  withCredentials: true, // Importante para enviar y recibir cookies
});

export const login = async (email: string, password: string): Promise<void> => {
  await API.post('/login', { email, password });
};

export const logout = async (): Promise<void> => {
  await API.post('/logout');
};

export const recuperarPassword = async (email: string): Promise<void> => {
  await API.post('/recuperar', { email });
};
