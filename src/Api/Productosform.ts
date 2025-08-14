// src/Api/productos.ts
import api from "@/Api/api";

/** Obtener lista de productos */
export const getProductos = async () => {
  try {
    const { data } = await api.get("/productos");
    return data.map((item: any) => ({
      ...item,
      fechaVencimiento: item.fecha_vencimiento,
      idCategoria: item.idCategoria || null,
    }));
  } catch (error) {
    console.error("❌ Error al obtener productos:", error);
    throw new Error("Error al obtener productos");
  }
};

/** Crear producto */
export const createProducto = async (payload: any) => {
  try {
    const body = {
      nombre: payload.nombre,
      descripcion: payload.descripcion || null,
      fecha_vencimiento: payload.fechaVencimiento || null,
      id_categoria: payload.idCategoriaId,
    };
    const { data } = await api.post("/productos", body);
    return data;
  } catch (error) {
    console.error("❌ Error al crear producto:", error);
    throw new Error("Error al crear producto");
  }
};

/** Actualizar producto */
export const updateProducto = async (id: number, payload: any) => {
  try {
    const body = {
      nombre: payload.nombre,
      descripcion: payload.descripcion || null,
      fecha_vencimiento: payload.fechaVencimiento || null,
      id_categoria: payload.idCategoriaId,
    };
    const { data } = await api.put(`/productos/${id}`, body);
    return data;
  } catch (error) {
    console.error("❌ Error al actualizar producto:", error);
    throw new Error("Error al actualizar producto");
  }
};

/** Eliminar producto */
export const deleteProducto = async (id: number) => {
  try {
    await api.delete(`/productos/${id}`);
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar producto:", error);
    throw new Error("Error al eliminar producto");
  }
};
