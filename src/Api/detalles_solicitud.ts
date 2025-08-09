import type { DetalleSolicitud, DetalleSolicitudPayload } from '@/types/types/detalles_solicitud';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

function toCamelCaseSolicitud(solicitud: any) {
  if (!solicitud) return null;
  return {
    id: solicitud.id,
    idUsuarioSolicitante: solicitud.id_usuario_solicitante,
    fechaSolicitud: solicitud.fecha_solicitud,
    estadoSolicitud: solicitud.estado_solicitud,
    created_at: solicitud.created_at,
    updated_at: solicitud.updated_at,
  };
}

function toCamelCaseProducto(producto: any) {
  if (!producto) return null;
  return {
    id: producto.id,
    nombre: producto.nombre,
    descripcion: producto.descripcion,
    fechaVencimiento: producto.fecha_vencimiento,
    idCategoria: producto.id_categoria,
    created_at: producto.created_at,
    updated_at: producto.updated_at,
  };
}

export async function getDetalleSolicitudes(): Promise<DetalleSolicitud[]> {
  const res = await fetch(`${API_BASE_URL}/detalle-solicitudes`);
  if (!res.ok) throw new Error('Error al obtener detalles de solicitudes');

  const data = await res.json();

  return data.map((d: any) => ({
    id: d.id,
    cantidadSolicitada: d.cantidad_solicitada,
    observaciones: d.observaciones,
    idProducto: toCamelCaseProducto(d.producto),     
    idSolicitud: toCamelCaseSolicitud(d.solicitud),  
    created_at: d.created_at,
    updated_at: d.updated_at,
  }));
}

export async function createDetalleSolicitud(payload: DetalleSolicitudPayload): Promise<DetalleSolicitud> {
  const res = await fetch(`${API_BASE_URL}/detalle-solicitudes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Error al crear detalle');
  }
  return res.json();
}

export async function updateDetalleSolicitud(id: number, payload: DetalleSolicitudPayload): Promise<DetalleSolicitud> {
  const res = await fetch(`${API_BASE_URL}/detalle-solicitudes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Error al actualizar detalle');
  }
  return res.json();
}

export async function deleteDetalleSolicitud(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/detalle-solicitudes/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Error al eliminar detalle');
}
