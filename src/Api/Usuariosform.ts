// src/Api/Usuarios.ts
import api from "@/Api/api";

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  telefono: string;
  id_area: number;
  id_rol: number;
  id_ficha?: number | null;
}

/** Obtener todos los usuarios con sus relaciones (área y rol) */
export const getUsuarios = async (): Promise<Usuario[]> => {
  try {
    const { data } = await api.get("/usuarios");
    return Array.isArray(data) ? data : data.data;
  } catch (error) {
    console.error("❌ Error al obtener usuarios:", error);
    throw new Error("Error al obtener usuarios");
  }
};

/** Crear usuario */
export const createUsuario = async (payload: Omit<Usuario, "id"> & { password: string }): Promise<Usuario> => {
  try {
    const body = {
      nombre: payload.nombre,
      apellido: payload.apellido,
      cedula: payload.cedula,
      email: payload.email,
      telefono: payload.telefono,
      password: payload.password,
      id_area: payload.id_area,
      id_rol: payload.id_rol,
      id_ficha: payload.id_ficha ?? null,
    };
    const { data } = await api.post("/usuarios", body);
    return data;
  } catch (error) {
    console.error("❌ Error al crear usuario:", error);
    throw new Error("Error al crear usuario");
  }
};

/** Actualizar usuario */
export const updateUsuario = async (
  id: number,
  payload: Partial<Omit<Usuario, "id"> & { password?: string }>
): Promise<Usuario> => {
  try {
    const body: Record<string, any> = {
      nombre: payload.nombre,
      apellido: payload.apellido,
      cedula: payload.cedula,
      email: payload.email,
      telefono: payload.telefono,
      id_area: payload.id_area,
      id_rol: payload.id_rol,
      id_ficha: payload.id_ficha ?? null,
    };
    if (payload.password) {
      body.password = payload.password;
    }
    const { data } = await api.put(`/usuarios/${id}`, body);
    return data;
  } catch (error) {
    console.error("❌ Error al actualizar usuario:", error);
    throw new Error("Error al actualizar usuario");
  }
};

/** Eliminar usuario */
export const deleteUsuario = async (id: number): Promise<boolean> => {
  try {
    await api.delete(`/usuarios/${id}`);
    return true;
  } catch (error) {
    console.error("❌ Error al eliminar usuario:", error);
    throw new Error("Error al eliminar usuario");
  }
};
