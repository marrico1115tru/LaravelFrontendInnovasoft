// src/Api/MunicipiosForm.ts

const API_URL = "http://127.0.0.1:8000/api/municipios";

// Obtener todos los municipios
export async function obtenerMunicipios(): Promise<any[]> {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error("Error al obtener municipios");
  const res = await response.json();
  // Laravel podría devolver array o { data: [] }
  return Array.isArray(res) ? res : res.data;
}

// Crear municipio
export async function crearMunicipio(payload: { nombre: string; departamento: string }) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Error al crear municipio");
  return await response.json();
}

// Actualizar municipio
export async function actualizarMunicipio(id: number, payload: { nombre: string; departamento: string }) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error("Error al actualizar municipio");
  return await response.json();
}

// Eliminar municipio
export async function eliminarMunicipio(id: number) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error al eliminar municipio");
  return true;
}
