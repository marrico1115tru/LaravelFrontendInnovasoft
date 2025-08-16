"use client";

import React, { useEffect, useState } from "react";
import { BarChart } from "./Graficasbases/GraficasBaseProductos";
import { Card } from "@/components/ui/card";
import DefaultLayout from "@/layouts/default";
import api from "@/Api/api"; // Instancia con token y baseURL
import Cookies from "js-cookie";
import { Lock } from "lucide-react";

interface ChartResponse {
  labels: string[];
  data: number[];
}

// Función para obtener permisos
const fetchPermisos = async (ruta: string, idRol: number) => {
  try {
    const { data } = await api.get("/por-ruta-rol/permisos", {
      params: { ruta, idRol },
    });
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

const VistaEstadisticasProductos: React.FC = () => {
  const [labelsSolicitados, setLabelsSolicitados] = useState<string[]>([]);
  const [valuesSolicitados, setValuesSolicitados] = useState<number[]>([]);
  const [labelsMovimientos, setLabelsMovimientos] = useState<string[]>([]);
  const [valuesMovimientos, setValuesMovimientos] = useState<number[]>([]);
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

        const rutaActual = "/VistaProductos";
        const permisosObtenidos = await fetchPermisos(rutaActual, idRol);
        setPermisos(permisosObtenidos);

        if (!permisosObtenidos.puede_ver) {
          setError("No tienes permiso para ver las estadísticas de productos.");
          setLoading(false);
          return;
        }

        const [resSolicitados, resMovimientos] = await Promise.all([
          api.get<ChartResponse>("/estadistica/mas-solicitados"),
          api.get<ChartResponse>("/estadisticas/mayor-movimiento"),
        ]);

        if (
          resSolicitados.data &&
          Array.isArray(resSolicitados.data.labels) &&
          Array.isArray(resSolicitados.data.data)
        ) {
          setLabelsSolicitados(resSolicitados.data.labels);
          setValuesSolicitados(resSolicitados.data.data.map((v: any) => Number(v) || 0));
        }

        if (
          resMovimientos.data &&
          Array.isArray(resMovimientos.data.labels) &&
          Array.isArray(resMovimientos.data.data)
        ) {
          setLabelsMovimientos(resMovimientos.data.labels);
          setValuesMovimientos(resMovimientos.data.data.map((v: any) => Number(v) || 0));
        }

      } catch (err: any) {
        setError(err.message || "Error al obtener estadísticas de productos");
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const dataBarSolicitados = {
    labels: labelsSolicitados,
    datasets: [
      {
        label: "Cantidad solicitada",
        data: valuesSolicitados,
        backgroundColor: labelsSolicitados.map(() => "#3B82F6"),
      },
    ],
    title: "Productos más solicitados",
  };

  const dataBarMovimientos = {
    labels: labelsMovimientos,
    datasets: [
      {
        label: "Movimientos",
        data: valuesMovimientos,
        backgroundColor: labelsMovimientos.map(() => "#F59E0B"),
      },
    ],
    title: "Productos con mayor movimiento",
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="p-6 bg-[#0f172a] min-h-screen flex justify-center items-center">
          <p className="text-white text-center">Cargando estadísticas...</p>
        </div>
      </DefaultLayout>
    );
  }

  if (error || !permisos.puede_ver) {
    return (
      <DefaultLayout>
        <div className="p-6 bg-[#0f172a] min-h-screen flex flex-col justify-center items-center gap-6 text-center">
          <Lock size={64} className="text-red-600" />
          <h1 className="text-white text-3xl font-bold">Acceso Denegado</h1>
          <p className="text-red-400">{error || "No tienes permiso para ver esta página."}</p>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="p-6 bg-[#0f172a] min-h-screen">
        <h1 className="text-white text-3xl font-bold mb-6 text-center">Estadísticas de Productos</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Productos más solicitados */}
          <Card className="bg-white text-gray-900 rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-2 text-center">Productos más solicitados</h2>
            <p className="text-sm text-gray-600 text-center mb-4">
              Cantidad de productos solicitados por los usuarios
            </p>
            <div className="max-w-2xl mx-auto h-96">
              <BarChart data={dataBarSolicitados} />
            </div>
          </Card>

          {/* Productos con mayor movimiento */}
          <Card className="bg-white text-gray-900 rounded-2xl shadow-md p-6">
            <h2 className="text-xl font-bold mb-2 text-center">Productos con mayor movimiento</h2>
            <p className="text-sm text-gray-600 text-center mb-4">
              Ranking de productos por cantidad de movimientos
            </p>
            <div className="max-w-2xl mx-auto h-96">
              <BarChart data={dataBarMovimientos} />
            </div>
          </Card>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default VistaEstadisticasProductos;
