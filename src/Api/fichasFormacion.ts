
import api from "@/Api/api";

export interface FichaFormacion {
  id: number;
  nombre: string;
  id_titulado: number;
  id_usuario_responsable?: number | null;
}


export const getFichasFormacion = async (): Promise<FichaFormacion[]> => {
  try {
    const { data } = await api.get("/fichas-formacion");
    return Array.isArray(data) ? data : data.data;
  } catch (error) {
    console.error("❌ Error al obtener fichas de formación:", error);
    throw new Error("Error al obtener fichas de formación");
  }
};


export const createFichaFormacion = async (
  payload: Omit<FichaFormacion, "id">
): Promise<FichaFormacion> => {
  try {
    const body = {
      nombre: payload.nombre,
      id_titulado: payload.id_titulado,
      id_usuario_responsable: payload.id_usuario_responsable ?? null,
    };
    const { data } = await api.post("/fichas-formacion", body);
    return data;
  } catch (error) {
    console.error("❌ Error al crear ficha de formación:", error);
    throw new Error("Error al crear ficha de formación");
  }
};


export const updateFichaFormacion = async (
  id: number,
  payload: Partial<Omit<FichaFormacion, "id">>
): Promise<FichaFormacion> => {
  try {
    const body = {
      nombre: payload.nombre,
      id_titulado: payload.id_titulado,
      id_usuario_responsable: payload.id_usuario_responsable ?? null,
    };
    const { data } = await api.put(`/fichas-formacion/${id}`, body);
    return data;
  } catch (error) {
    console.error("❌ Error al actualizar ficha de formación:", error);
    throw new Error("Error al actualizar ficha de formación");
  }
};


export const deleteFichaFormacion = async (id: number): Promise<boolean> => {
  try {
    await api.delete(`/fichas-formacion/${id}`);
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar ficha de formación:", error);
    throw new Error("Error al eliminar ficha de formación");
  }
};
