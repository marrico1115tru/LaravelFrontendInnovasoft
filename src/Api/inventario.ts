import { Inventario, InventarioFormValues } from "@/types/types/inventario";

const API_BASE_URL = "http://localhost:8000/api";

/** Obtener lista */
export async function getInventarios(): Promise<Inventario[]> {
  const res = await fetch(`${API_BASE_URL}/inventarios`);
  if (!res.ok) throw new Error("Error al obtener inventarios");
  return res.json();
}

/** Crear */
export async function createInventario(data: InventarioFormValues): Promise<Inventario> {
  const res = await fetch(`${API_BASE_URL}/inventarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_producto: data.idProductoId,
      fk_sitio: data.fkSitioId,
      stock: data.stock,
    }),
  });
  if (!res.ok) throw new Error("Error al crear inventario");
  return res.json();
}

/** Actualizar */
export async function updateInventario(id: number, data: InventarioFormValues): Promise<Inventario> {
  const res = await fetch(`${API_BASE_URL}/inventarios/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_producto: data.idProductoId,
      fk_sitio: data.fkSitioId,
      stock: data.stock,
    }),
  });
  if (!res.ok) throw new Error("Error al actualizar inventario");
  return res.json();
}

/** Eliminar */
export async function deleteInventario(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/inventarios/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Error al eliminar inventario");
}

/** Modificar stock en inventario */
export async function modificarStockInventario(
  id: number,
  data: { cantidad: number; tipo: "incrementar" | "disminuir" }
): Promise<Inventario> {
  const res = await fetch(`${API_BASE_URL}/inventarios/${id}/modificar-stock`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || "Error modificando stock");
  }
  return res.json();
}
