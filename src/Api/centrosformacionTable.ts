import api from "@/Api/api"; 


export const getCentrosFormacion = async () => {
  try {
    const { data } = await api.get("/centros-formacion");
    return data;
  } catch (error) {
    console.error("❌ Error al listar centros de formación:", error);
    throw new Error("Error al listar centros de formación");
  }
};


export const createCentroFormacion = async (data: any) => {
  try {
    const payload = {
      ...data,
      id_municipio: data.idMunicipio?.id, 
    };
    const { data: res } = await api.post("/centros-formacion", payload);
    return res;
  } catch (error) {
    console.error("❌ Error al crear centro de formación:", error);
    throw new Error("Error al crear centro de formación");
  }
};


export const updateCentroFormacion = async (id: number, data: any) => {
  try {
    const payload = {
      ...data,
      id_municipio: data.idMunicipio?.id,
    };
    const { data: res } = await api.put(`/centros-formacion/${id}`, payload);
    return res;
  } catch (error) {
    console.error("❌ Error al actualizar centro de formación:", error);
    throw new Error("Error al actualizar centro de formación");
  }
};


export const deleteCentroFormacion = async (id: number) => {
  try {
    const { data } = await api.delete(`/centros-formacion/${id}`);
    return data;
  } catch (error) {
    console.error("❌ Error al eliminar centro de formación:", error);
    throw new Error("Error al eliminar centro de formación");
  }
};
