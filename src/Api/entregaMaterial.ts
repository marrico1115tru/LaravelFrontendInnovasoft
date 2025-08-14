import api from "@/Api/api"; 
import { EntregaMaterial } from "@/types/types/EntregaMaterial";

const API_URL = "/entregas-materiales"; // ya no ponemos el host porque lo maneja api.ts

/** Obtiene todas las entregas con objetos relacionados completos */
export const getEntregasMaterial = async (): Promise<EntregaMaterial[]> => {
  const res = await api.get(API_URL);
  return res.data.map((item: any) => ({
    ...item,
    ficha: item.ficha || null,
    solicitud: item.solicitud || null,
    responsable: item.responsable || null,
  }));
};

/** Tipo para el payload, sólo con campos que el backend requiere para crear/actualizar */
export interface EntregaMaterialPayload {
  fecha_entrega: string;
  observaciones?: string | null;
  id_ficha_formacion: number;
  id_solicitud: number;
  id_usuario_responsable: number;
}

/** Crear entrega */
export const createEntregaMaterial = async (
  data: EntregaMaterialPayload
): Promise<EntregaMaterial> => {
  const res = await api.post(API_URL, data);
  return res.data;
};

/** Actualizar entrega */
export const updateEntregaMaterial = async (
  id: number,
  data: EntregaMaterialPayload
): Promise<EntregaMaterial> => {
  const res = await api.put(`${API_URL}/${id}`, data);
  return res.data;
};

/** Eliminar entrega */
export const deleteEntregaMaterial = async (id: number): Promise<void> => {
  await api.delete(`${API_URL}/${id}`);
};
