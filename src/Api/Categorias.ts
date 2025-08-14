import api from "@/Api/api"; 


export const getCategoriasProductos = async () => {
  try {
    const { data } = await api.get("/categoria-productos");
    return data;
  } catch (error) {
    console.error("❌ Error al listar categorías de productos:", error);
    throw new Error("Error al listar categorías de productos");
  }
};

export const createCategoriaProducto = async (payload: { nombre: string; unpsc?: string }) => {
  try {
    const { data } = await api.post("/categoria-productos", payload);
    return data;
  } catch (error) {
    console.error("❌ Error al crear categoría de producto:", error);
    throw new Error("Error al crear categoría de producto");
  }
};


export const updateCategoriaProducto = async (id: number, payload: { nombre: string; unpsc?: string }) => {
  try {
    const { data } = await api.put(`/categoria-productos/${id}`, payload);
    return data;
  } catch (error) {
    console.error("❌ Error al actualizar categoría de producto:", error);
    throw new Error("Error al actualizar categoría de producto");
  }
};


export const deleteCategoriaProducto = async (id: number) => {
  try {
    const { data } = await api.delete(`/categoria-productos/${id}`);
    return data;
  } catch (error) {
    console.error("❌ Error al eliminar categoría de producto:", error);
    throw new Error("Error al eliminar categoría de producto");
  }
};
