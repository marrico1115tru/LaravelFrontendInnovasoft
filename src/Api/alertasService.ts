// Importamos tu configurador de Axios que ya tienes en 'api.ts'
import api from './api';

// Definimos cómo lucen los datos de los productos que tu API envía
interface ProductoAlerta {
  nombre: string;
  fecha_vencimiento: string;
  stock_total: number;
}

/**
 * Llama a la ruta de Laravel para obtener los productos que ya están vencidos.
 */
export const getProductosVencidos = async (): Promise<ProductoAlerta[]> => {
  try {
    const response = await api.get<{ data: ProductoAlerta[] }>('/reportes/productos-vencidos');
    // Laravel devuelve { "data": [...] }, por eso accedemos a response.data.data
    return response.data.data;
  } catch (error) {
    console.error("Error API: No se pudo obtener productos vencidos.", error);
    return []; // Devolvemos un array vacío si hay un error
  }
};

/**
 * Llama a la ruta de Laravel para obtener los productos cercanos a su fecha de vencimiento.
 */
export const getProductosProximosAVencer = async (): Promise<ProductoAlerta[]> => {
  try {
    const response = await api.get<{ data: ProductoAlerta[] }>('/reportes/productos-proximos-vencer');
    return response.data.data;
  } catch (error) {
    console.error("Error API: No se pudo obtener productos próximos a vencer.", error);
    return [];
  }
};