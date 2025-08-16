"use client";

import React, { useEffect, useState } from "react";
import api from "@/Api/api";
import { BarChart, PieChart } from "./Graficasbases/GraficasBaseSitios";
import { Card } from "@/components/ui/card";
import DefaultLayout from "@/layouts/default";
import Cookies from "js-cookie";
import { Lock } from "lucide-react";


interface EstadisticasSitiosResponse {
  labels: string[];
  data: number[];
}


const fetchPermisos = async (ruta: string, idRol: number) => {
  try {
    const { data } = await api.get("/por-ruta-rol/permisos", { params: { ruta, idRol } });
    return data.permisos;
  } catch (error) {
    console.error("Error al obtener permisos:", error);
    return {
      puede_ver: false,
      puede_crear: false,
      puede_editar: false,
      puede_eliminar: false,
    };
  }
};

const VistaEstadisticasSitios: React.FC = () => {
  const [labels, setLabels] = useState<string[]>([]);
  const [values, setValues] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [permisos, setPermisos] = useState({
    puede_ver: false,
    puede_crear: false,
    puede_editar: false,
    puede_eliminar: false,
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        const userCookie = Cookies.get("user");
        if (!userCookie) throw new Error("No se encontró la sesión del usuario. Por favor, inicie sesión.");

        const user = JSON.parse(userCookie);
        const idRol = user?.id_rol;
        if (!idRol) throw new Error("El usuario no tiene un rol válido asignado.");

        const rutaActual = "/VistaEstadisticasSitios";
        const permisosObtenidos = await fetchPermisos(rutaActual, idRol);
        setPermisos(permisosObtenidos);

        if (!permisosObtenidos.puede_ver) {
          setError("No tienes permiso para ver las estadísticas de sitios.");
          setLoading(false);
          return;
        }

        const { data } = await api.get<EstadisticasSitiosResponse>("/estadisticas/sitios");

        setLabels(data.labels || []);
        setValues(data.data || []);
      } catch (err: any) {
        setError(err.message || "Error al obtener estadísticas de sitios");
        console.error("❌ Error al obtener estadísticas de sitios:", err);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

 
  const colores = labels.map((estado) => (estado === "ACTIVO" ? "#4ADE80" : "#F87171"));

  
  const total = values.reduce((acc, val) => acc + val, 0);
  const porcentajes = values.map((valor) => (total > 0 ? Number(((valor / total) * 100).toFixed(2)) : 0));

 
  const dataBarSitios = {
    labels,
    datasets: [
      {
        label: "Cantidad de Sitios",
        data: values,
        backgroundColor: colores,
      },
    ],
  };

  const dataPieSitios = {
    labels: labels.map((label, index) => `${label} (${porcentajes[index]}%)`),
    datasets: [
      {
        data: values,
        backgroundColor: colores,
      },
    ],
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="p-6 bg-[#0f172a] min-h-screen flex justify-center items-center text-white">
          <p>Cargando estadísticas...</p>
        </div>
      </DefaultLayout>
    );
  }

  if (error || !permisos.puede_ver) {
    return (
      <DefaultLayout>
        <div className="p-6 bg-[#0f172a] min-h-screen flex flex-col items-center justify-center gap-6 text-center text-white">
          <Lock size={64} className="text-red-600" />
          <h1 className="text-3xl font-bold">Acceso Denegado</h1>
          <p className="text-red-400">{error || "No tienes permiso para ver esta página."}</p>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="p-6 bg-[#0f172a] min-h-screen">
        <h1 className="text-white text-3xl font-bold mb-6 text-center">Estadísticas de Sitios</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <Card className="bg-white text-gray-900 rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-2 text-center">Sitios Activos vs Inactivos</h2>
            <p className="text-sm text-gray-600 text-center mb-4">
              Comparación de sitios activos e inactivos
            </p>
            <div className="max-w-2xl mx-auto">
              <BarChart data={dataBarSitios} />
            </div>
          </Card>

          <Card className="bg-white text-gray-900 rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-2 text-center">Distribución de Sitios (%)</h2>
            <p className="text-sm text-gray-600 text-center mb-4">
              Porcentaje de sitios activos e inactivos
            </p>
            <div className="max-w-md mx-auto">
              <PieChart data={dataPieSitios} />
            </div>
          </Card>

        </div>
      </div>
    </DefaultLayout>
  );
};

export default VistaEstadisticasSitios;
