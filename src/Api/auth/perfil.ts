import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

export const getPerfil = () => {
  return API.get("/perfil");
};
