import api from "../api";
import Cookies from "js-cookie";

export const login = async (email: string, password: string) => {
  const { data } = await api.post("/login", { email, password });

  // Guardar token en cookies por 1 día
  Cookies.set("token", data.token, { expires: 1 });

  return data;
};
