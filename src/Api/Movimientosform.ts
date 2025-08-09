import axios from 'axios';
import type { Movimiento, MovimientoPayload } from '@/types/types/movimientoInventario';

const API_URL = 'http://127.0.0.1:8000/api/movimientos';
const config = { withCredentials: true };

/** Obtener movimientos */
export const getMovimientos = async (): Promise<Movimiento[]> => {
  const res = await axios.get(API_URL, config);
  return res.data;
};

/** Crear movimiento */
export const createMovimiento = async (data: MovimientoPayload): Promise<Movimiento> => {
  // Enviar data con campos en snake_case y todos obligatorios.
  const res = await axios.post(API_URL, data, config);
  return res.data;
};

/** Actualizar movimiento */
export const updateMovimiento = async (id: number, data: MovimientoPayload): Promise<Movimiento> => {
  const res = await axios.put(`${API_URL}/${id}`, data, config);
  return res.data;
};

/** Eliminar movimiento */
export const deleteMovimiento = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, config);
};
