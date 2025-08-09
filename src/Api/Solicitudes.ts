// @/Api/Solicitudes.ts

import type { Solicitud, SolicitudPayload } from '@/types/types/Solicitud';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

/** Obtener lista de solicitudes */
export async function getSolicitudes(): Promise<Solicitud[]> {
  const res = await fetch(`${API_BASE_URL}/solicitudes`);
  if (!res.ok) throw new Error('Error al obtener solicitudes');
  return res.json();
}

/** Crear solicitud */
export async function createSolicitud(payload: SolicitudPayload): Promise<Solicitud> {
  const res = await fetch(`${API_BASE_URL}/solicitudes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload), // El payload debe usar { fecha_solicitud, estado_solicitud, id_usuario_solicitante }
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Error al crear solicitud');
  }
  return res.json();
}

/** Actualizar solicitud */
export async function updateSolicitud(id: number, payload: SolicitudPayload): Promise<Solicitud> {
  const res = await fetch(`${API_BASE_URL}/solicitudes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Error al actualizar solicitud');
  }
  return res.json();
}

/** Eliminar solicitud */
export async function deleteSolicitud(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/solicitudes/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar solicitud');
}
