/* Usuario “ligero” que solo lleva el id cuando se envía al backend */
export interface UsuarioRef {
  id: number;
}

/* Usuario completo que viene del backend en API usuarios (para tu lista local) */
export interface Usuario extends UsuarioRef {
  nombre: string;
  apellido: string;
}

/* Objeto que devuelve el backend para una solicitud (según respuesta real) */
export interface Solicitud {
  detalleSolicituds: any;
  entregaMaterials: any;
  id: number;
  fecha_solicitud: string;              // Propiedad comes from backend, snake_case
  estado_solicitud: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | null;
  id_usuario_solicitante: number;       // Es solo ID según backend, no un objeto
}

/* Objeto que envías al backend */
export interface SolicitudPayload {
  fecha_solicitud: string;
  estado_solicitud: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  id_usuario_solicitante: number;
}

/* Valores que maneja tu formulario */
export interface SolicitudFormValues {
  fecha_solicitud: string;
  estado_solicitud: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  id_usuario_solicitante: number;  // solo el ID para el <Select/>
}
