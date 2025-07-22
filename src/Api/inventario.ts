import axios from "axios";
import { Inventario, InventarioFormValues } from "@/types/types/inventario";

const API_URL = "http://localhost:8000/api/inventario";

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Para enviar cookies, token httpOnly
});

export const getInventarios = async (): Promise<Inventario[]> => {
  const res = await axiosInstance.get("/");
  // Laravel normalmente usa { data: [...] }
  if (res.data && Array.isArray(res.data)) return res.data;
  if (res.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

export const createInventario = async (data: InventarioFormValues): Promise<Inventario> => {
  const res = await axiosInstance.post("/", {
    stock: data.stock,
    fkSitio: { id: data.fkSitioId },
    idProducto: { id: data.idProductoId },
  });
  return res.data.data || res.data;
};

export const updateInventario = async (id: number, data: InventarioFormValues): Promise<Inventario> => {
  const res = await axiosInstance.put(`/${id}`, {
    stock: data.stock,
    fkSitio: { id: data.fkSitioId },
    idProducto: { id: data.idProductoId },
  });
  return res.data.data || res.data;
};

export const deleteInventario = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/${id}`);
};
