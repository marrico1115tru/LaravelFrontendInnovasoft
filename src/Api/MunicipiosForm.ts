// src/Api/MunicipiosForm.ts
import api from "@/Api/api";

/** Obtener todos los municipios */
export const obtenerMunicipios = async (): Promise<any[]> => {
  try {
    const { data } = await api.get("/municipios");
    return Array.isArray(data) ? data : data.data;
  } catch (error) {
    console.error("❌ Error al obtener municipios:", error);
    throw new Error("Error al obtener municipios");
  }
};

/** Crear municipio */
export const crearMunicipio = async (payload: { nombre: string; departamento: string }) => {
  try {
    const { data } = await api.post("/municipios", payload);
    return data;
  } catch (error) {
    console.error("❌ Error al crear municipio:", error);
    throw new Error("Error al crear municipio");
  }
};

/** Actualizar municipio */
export const actualizarMunicipio = async (id: number, payload: { nombre: string; departamento: string }) => {
  try {
    const { data } = await api.put(`/municipios/${id}`, payload);
    return data;
  } catch (error) {
    console.error("❌ Error al actualizar municipio:", error);
    throw new Error("Error al actualizar municipio");
  }
};

/** Eliminar municipio */
export const eliminarMunicipio = async (id: number) => {
  try {
    await api.delete(`/municipios/${id}`);
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar municipio:", error);
    throw new Error("Error al eliminar municipio");
  }
};
