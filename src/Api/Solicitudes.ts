// src/Api/Solicitudes.ts
import api from "@/Api/api";
import type { Solicitud, SolicitudPayload } from "@/types/types/Solicitud";

/** Obtener lista de solicitudes */
export const getSolicitudes = async (): Promise<Solicitud[]> => {
  try {
    const { data } = await api.get("/solicitudes");
    return data;
  } catch (error) {
    console.error("❌ Error al obtener solicitudes:", error);
    throw new Error("Error al obtener solicitudes");
  }
};

/** Crear solicitud */
export const createSolicitud = async (payload: SolicitudPayload): Promise<Solicitud> => {
  try {
    const { data } = await api.post("/solicitudes", payload);
    return data;
  } catch (error) {
    console.error("❌ Error al crear solicitud:", error);
    throw new Error("Error al crear solicitud");
  }
};

/** Actualizar solicitud */
export const updateSolicitud = async (id: number, payload: SolicitudPayload): Promise<Solicitud> => {
  try {
    const { data } = await api.put(`/solicitudes/${id}`, payload);
    return data;
  } catch (error) {
    console.error("❌ Error al actualizar solicitud:", error);
    throw new Error("Error al actualizar solicitud");
  }
};

/** Eliminar solicitud */
export const deleteSolicitud = async (id: number): Promise<boolean> => {
  try {
    await api.delete(`/solicitudes/${id}`);
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar solicitud:", error);
    throw new Error("Error al eliminar solicitud");
  }
};
