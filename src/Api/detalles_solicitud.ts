import api from "@/Api/api"; 
import { DetalleSolicitud } from "@/types/types/detalles_solicitud";


export const getDetallesSolicitud = async (): Promise<DetalleSolicitud[]> => {
  try {
    const { data } = await api.get<DetalleSolicitud[]>("/detalle-solicitudes");
    return data;
  } catch (error) {
    console.error("❌ Error al listar detalles de solicitud:", error);
    throw new Error("Error al listar detalles de solicitud");
  }
};


export const createDetalleSolicitud = async (
  payload: Omit<
    DetalleSolicitud,
    "id" | "created_at" | "updated_at" | "solicitud" | "producto"
  >
) => {
  try {
    const { data } = await api.post<DetalleSolicitud>(
      "/detalle-solicitudes",
      payload
    );
    return data;
  } catch (error) {
    console.error("❌ Error al crear detalle de solicitud:", error);
    throw new Error("Error al crear detalle de solicitud");
  }
};


export const updateDetalleSolicitud = async (
  id: number,
  payload: Partial<
    Omit<
      DetalleSolicitud,
      "id" | "created_at" | "updated_at" | "solicitud" | "producto"
    >
  >
) => {
  try {
    const { data } = await api.put<DetalleSolicitud>(
      `/detalle-solicitudes/${id}`,
      payload
    );
    return data;
  } catch (error) {
    console.error("❌ Error al actualizar detalle de solicitud:", error);
    throw new Error("Error al actualizar detalle de solicitud");
  }
};


export const deleteDetalleSolicitud = async (id: number) => {
  try {
    await api.delete(`/detalle-solicitudes/${id}`);
  } catch (error) {
    console.error("❌ Error al eliminar detalle de solicitud:", error);
    throw new Error("Error al eliminar detalle de solicitud");
  }
};
