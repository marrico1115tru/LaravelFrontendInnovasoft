import api from "@/Api/api";

export const getRoles = async () => {
  const { data } = await api.get("/roles");
  return data;
};

export const createRol = async (data: any) => {
  const payload = { nombre_rol: data.nombreRol || data.nombre_rol };
  const { data: res } = await api.post("/roles", payload);
  return res;
};

export const updateRol = async (id: number, data: any) => {
  const payload = { nombre_rol: data.nombreRol || data.nombre_rol };
  const { data: res } = await api.put(`/roles/${id}`, payload);
  return res;
};

export const deleteRol = async (id: number) => {
  const { data: res } = await api.delete(`/roles/${id}`);
  return res;
};
