import axios from "axios";
import { EntregaMaterial } from "@/types/types/EntregaMaterial";

const API_URL = "http://127.0.0.1:8000/api/entregas-materiales";

const config = {
  withCredentials: true,
};

/** Obtiene todas las entregas con objetos relacionados completos */
export const getEntregasMaterial = async (): Promise<EntregaMaterial[]> => {
  const res = await axios.get(API_URL, config);
  return res.data.map((item: any) => ({
    ...item,
    // Aquí traemos los objetos completos anidados que el backend envía
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
  const res = await axios.post(API_URL, data, config);
  return res.data;
};

/** Actualizar entrega */
export const updateEntregaMaterial = async (
  id: number,
  data: EntregaMaterialPayload
): Promise<EntregaMaterial> => {
  const res = await axios.put(`${API_URL}/${id}`, data, config);
  return res.data;
};

/** Eliminar entrega */
export const deleteEntregaMaterial = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, config);
};
