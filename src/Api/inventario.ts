import api from "@/Api/api";
import { Inventario, InventarioFormValues } from "@/types/types/inventario";

/** Obtener inventarios */
export const getInventarios = async (): Promise<Inventario[]> => {
  try {
    const { data } = await api.get("/inventarios");
    return data;
  } catch (error) {
    console.error("❌ Error al obtener inventarios:", error);
    throw new Error("Error al obtener inventarios");
  }
};

/** Crear inventario */
export const createInventario = async (formData: InventarioFormValues): Promise<Inventario> => {
  try {
    const payload = {
      id_producto: formData.idProductoId,
      fk_sitio: formData.fkSitioId,
      stock: formData.stock,
    };
    const { data } = await api.post("/inventarios", payload);
    return data;
  } catch (error) {
    console.error("❌ Error al crear inventario:", error);
    throw new Error("Error al crear inventario");
  }
};

/** Actualizar inventario */
export const updateInventario = async (id: number, formData: InventarioFormValues): Promise<Inventario> => {
  try {
    const payload = {
      id_producto: formData.idProductoId,
      fk_sitio: formData.fkSitioId,
      stock: formData.stock,
    };
    const { data } = await api.put(`/inventarios/${id}`, payload);
    return data;
  } catch (error) {
    console.error("❌ Error al actualizar inventario:", error);
    throw new Error("Error al actualizar inventario");
  }
};

/** Eliminar inventario */
export const deleteInventario = async (id: number): Promise<void> => {
  try {
    await api.delete(`/inventarios/${id}`);
  } catch (error) {
    console.error("❌ Error al eliminar inventario:", error);
    throw new Error("Error al eliminar inventario");
  }
};

/** Modificar stock de un inventario */
export const modificarStockInventario = async (
  id: number,
  data: { cantidad: number; tipo: "incrementar" | "disminuir" }
): Promise<Inventario> => {
  try {
    const { data: result } = await api.put(`/inventarios/${id}/modificar-stock`, data);
    return result;
  } catch (error) {
    console.error("❌ Error modificando stock:", error);
    throw new Error("Error modificando stock");
  }
};
