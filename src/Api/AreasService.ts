const API_URL = "http://127.0.0.1:8000/api/areas";

export async function getAreas() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Error al listar áreas");
  const res = await response.json();
  return Array.isArray(res) ? res : res.data;
}

export async function createArea(payload: any) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    // No agregar credentials porque no usas autenticación
  });
  if (!response.ok) throw new Error("Error al crear área");
  return await response.json();
}

export async function updateArea(id: number, payload: any) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Error al actualizar área");
  return await response.json();
}

export async function deleteArea(id: number) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error al eliminar área");
  return true;
}
