import api from "@/Api/api";
import type {
  Movimiento,
  CreateMovimientoData,
  UpdateMovimientoData,
} from "@/types/types/movimientos";

export const getMovimientos = async (): Promise<Movimiento[]> => {
  try {
    const { data } = await api.get("/movimientos");
    return Array.isArray(data) ? data : data.data;
  } catch (error) {
    console.error("❌ Error al listar movimientos:", error);
    throw new Error("Error al listar movimientos");
  }
};

export const getMovimientoById = async (id: number): Promise<Movimiento> => {
  try {
    const { data } = await api.get(`/movimientos/${id}`);
    return data;
  } catch (error) {
    console.error(`❌ Error al obtener movimiento con ID ${id}:`, error);
    throw new Error(`Error al obtener movimiento con ID ${id}`);
  }
};

export const createMovimiento = async (
  payload: CreateMovimientoData
): Promise<Movimiento> => {
  try {
    const { data } = await api.post("/movimientos", payload);
    return data;
  } catch (error) {
    console.error("❌ Error al crear movimiento:", error);
    throw new Error("Error al crear movimiento");
  }
};

export const updateMovimiento = async (
  id: number,
  payload: UpdateMovimientoData
): Promise<Movimiento> => {
  try {
    const { data } = await api.put(`/movimientos/${id}`, payload);
    return data;
  } catch (error) {
    console.error("❌ Error al actualizar movimiento:", error);
    throw new Error("Error al actualizar movimiento");
  }
};

export const deleteMovimiento = async (id: number): Promise<boolean> => {
  try {
    await api.delete(`/movimientos/${id}`);
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar movimiento:", error);
    throw new Error("Error al eliminar movimiento");
  }
};
