import api from "@/Api/api";

export const getAreas = async () => {
  try {
    const { data } = await api.get("/areas");
    return Array.isArray(data) ? data : data.data;
  } catch (error) {
    console.error("❌ Error al listar áreas:", error);
    throw new Error("Error al listar áreas");
  }
};

export const createArea = async (payload: any) => {
  try {
    const { data } = await api.post("/areas", payload);
    return data;
  } catch (error) {
    console.error("❌ Error al crear área:", error);
    throw new Error("Error al crear área");
  }
};

export const updateArea = async (id: number, payload: any) => {
  try {
    const { data } = await api.put(`/areas/${id}`, payload);
    return data;
  } catch (error) {
    console.error("❌ Error al actualizar área:", error);
    throw new Error("Error al actualizar área");
  }
};

export const deleteArea = async (id: number) => {
  try {
    await api.delete(`/areas/${id}`);
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar área:", error);
    throw new Error("Error al eliminar área");
  }
};
