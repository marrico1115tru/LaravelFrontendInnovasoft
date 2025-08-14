// src/Api/SitioService.ts
import api from "@/Api/api";

/** Obtener lista de sitios */
export const getSitios = async () => {
  try {
    const { data } = await api.get("/sitios");
    return data; // Debe traer area y tipo_sitio como objetos completos
  } catch (error) {
    console.error("❌ Error al obtener sitios:", error);
    throw new Error("Error al obtener sitios");
  }
};

/** Crear sitio */
export const createSitio = async (payload: any) => {
  try {
    const body = {
      nombre: payload.nombre,
      ubicacion: payload.ubicacion,
      estado: payload.estado,
      id_area: payload.id_area,
      id_tipo_sitio: payload.id_tipo_sitio,
    };
    const { data } = await api.post("/sitios", body);
    return data;
  } catch (error) {
    console.error("❌ Error al crear sitio:", error);
    throw new Error("Error al crear sitio");
  }
};

/** Actualizar sitio */
export const updateSitio = async (id: number, payload: any) => {
  try {
    const body = {
      nombre: payload.nombre,
      ubicacion: payload.ubicacion,
      estado: payload.estado,
      id_area: payload.id_area,
      id_tipo_sitio: payload.id_tipo_sitio,
    };
    const { data } = await api.put(`/sitios/${id}`, body);
    return data;
  } catch (error) {
    console.error("❌ Error al actualizar sitio:", error);
    throw new Error("Error al actualizar sitio");
  }
};

/** Eliminar sitio */
export const deleteSitio = async (id: number) => {
  try {
    await api.delete(`/sitios/${id}`);
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar sitio:", error);
    throw new Error("Error al eliminar sitio");
  }
};
