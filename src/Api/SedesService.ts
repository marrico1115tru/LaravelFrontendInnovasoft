// src/Api/sedes.ts
import api from "@/Api/api";

/** Obtener lista de sedes */
export const getSedes = async () => {
  try {
    const { data } = await api.get("/sedes");
    return data; // Incluye "centro_formacion" según backend
  } catch (error) {
    console.error("❌ Error al obtener sedes:", error);
    throw new Error("Error al obtener sedes");
  }
};

/** Crear sede */
export const createSede = async (payload: any) => {
  try {
    const body = {
      nombre: payload.nombre,
      ubicacion: payload.ubicacion,
      id_centro_formacion:
        payload.id_centro_formacion ||
        payload.idCentroFormacion ||
        payload.idCentro,
    };
    const { data } = await api.post("/sedes", body);
    return data;
  } catch (error) {
    console.error("❌ Error al crear sede:", error);
    throw new Error("Error al crear sede");
  }
};

/** Actualizar sede */
export const updateSede = async (id: number, payload: any) => {
  try {
    const body = {
      nombre: payload.nombre,
      ubicacion: payload.ubicacion,
      id_centro_formacion:
        payload.id_centro_formacion ||
        payload.idCentroFormacion ||
        payload.idCentro,
    };
    const { data } = await api.put(`/sedes/${id}`, body);
    return data;
  } catch (error) {
    console.error("❌ Error al actualizar sede:", error);
    throw new Error("Error al actualizar sede");
  }
};

/** Eliminar sede */
export const deleteSede = async (id: number) => {
  try {
    await api.delete(`/sedes/${id}`);
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar sede:", error);
    throw new Error("Error al eliminar sede");
  }
};
