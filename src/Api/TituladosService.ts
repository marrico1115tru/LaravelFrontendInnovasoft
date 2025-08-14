// src/Api/Titulados.ts
import api from "@/Api/api";

interface Titulado {
  id: number;
  nombre: string;
}

/** Obtener todos los titulados */
export const getTitulados = async (): Promise<Titulado[]> => {
  try {
    const { data } = await api.get("/titulados");
    return Array.isArray(data) ? data : data.data;
  } catch (error) {
    console.error("❌ Error al obtener titulados:", error);
    throw new Error("Error al obtener titulados");
  }
};

/** Crear titulado */
export const createTitulado = async (payload: { nombre: string }): Promise<Titulado> => {
  try {
    const { data } = await api.post("/titulados", payload);
    return data;
  } catch (error) {
    console.error("❌ Error al crear titulado:", error);
    throw new Error("Error al crear titulado");
  }
};

/** Actualizar titulado */
export const updateTitulado = async (
  id: number,
  payload: { nombre: string }
): Promise<Titulado> => {
  try {
    const { data } = await api.put(`/titulados/${id}`, payload);
    return data;
  } catch (error) {
    console.error("❌ Error al actualizar titulado:", error);
    throw new Error("Error al actualizar titulado");
  }
};

/** Eliminar titulado */
export const deleteTitulado = async (id: number): Promise<boolean> => {
  try {
    await api.delete(`/titulados/${id}`);
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar titulado:", error);
    throw new Error("Error al eliminar titulado");
  }
};
