// src/Api/TipoSitios.ts
import api from "@/Api/api";
import { TipoSitio, TipoSitioFormValues } from "@/types/types/tipo_sitios";

/** Obtener todos los tipos de sitio */
export const getTiposSitio = async (): Promise<TipoSitio[]> => {
  try {
    const { data } = await api.get("/tipo-sitios");
    return data;
  } catch (error) {
    console.error("❌ Error al obtener tipos de sitio:", error);
    throw new Error("Error al obtener tipos de sitio");
  }
};

/** Crear tipo de sitio */
export const createTipoSitio = async (
  payload: TipoSitioFormValues
): Promise<TipoSitio> => {
  try {
    const { data } = await api.post("/tipo-sitios", payload);
    return data;
  } catch (error) {
    console.error("❌ Error al crear tipo de sitio:", error);
    throw new Error("Error al crear tipo de sitio");
  }
};

/** Actualizar tipo de sitio */
export const updateTipoSitio = async (
  id: number,
  payload: TipoSitioFormValues
): Promise<TipoSitio> => {
  try {
    const { data } = await api.put(`/tipo-sitios/${id}`, payload);
    return data;
  } catch (error) {
    console.error("❌ Error al actualizar tipo de sitio:", error);
    throw new Error("Error al actualizar tipo de sitio");
  }
};

/** Eliminar tipo de sitio */
export const deleteTipoSitio = async (id: number): Promise<boolean> => {
  try {
    await api.delete(`/tipo-sitios/${id}`);
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar tipo de sitio:", error);
    throw new Error("Error al eliminar tipo de sitio");
  }
};
