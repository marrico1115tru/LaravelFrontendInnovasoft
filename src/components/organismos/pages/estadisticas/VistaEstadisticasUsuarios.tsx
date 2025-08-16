"use client";

import { useEffect, useState } from "react";
import { BarChart } from "./Graficasbases/GraficasBaseProductos";
import api from "@/Api/api"; 
import DefaultLayout from "@/layouts/default";
import Cookies from "js-cookie";
import { Lock } from "lucide-react";
import { Card } from "@heroui/react";

interface ChartData {
  labels: string[];
  data: number[];
}

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

export default function VistaEstadisticasUsuarios() {
  const [productosPorUsuario, setProductosPorUsuario] = useState<ChartData>({
    labels: [],
    data: [],
  });
  const [usuariosPorRol, setUsuariosPorRol] = useState<ChartData>({
    labels: [],
    data: [],
  });
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

        const rutaActual = "/VistaEstadisticasUsuarios";
        const permisosObtenidos = await fetchPermisos(rutaActual, idRol);
        setPermisos(permisosObtenidos);

        if (!permisosObtenidos.puede_ver) {
          setError("No tienes permiso para ver las estadísticas de usuarios.");
          setLoading(false);
          return;
        }

        const [productosRes, rolesRes] = await Promise.all([
          api.get<ChartData>("/estadisticas/solicitudes-por-usuario"),
          api.get<ChartData>("/estadisticas/usuarios-por-rol"),
        ]);

        setProductosPorUsuario({
          labels: productosRes.data.labels || [],
          data: productosRes.data.data || [],
        });

        setUsuariosPorRol({
          labels: rolesRes.data.labels || [],
          data: rolesRes.data.data || [],
        });
      } catch (err: any) {
        setError(err.message || "Error al obtener datos de estadísticas.");
        console.error("❌ Error en VistaEstadisticasUsuarios:", err);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  if (loading) {
    return (
      <DefaultLayout>
        <div className="p-6 space-y-6 bg-slate-900 min-h-screen flex justify-center items-center text-white">
          <p>Cargando datos...</p>
        </div>
      </DefaultLayout>
    );
  }

  if (error || !permisos.puede_ver) {
    return (
      <DefaultLayout>
        <div className="p-6 space-y-6 bg-slate-900 min-h-screen flex flex-col justify-center items-center gap-6 text-center text-white">
          <Lock size={64} className="text-red-600" />
          <h1 className="text-3xl font-bold">Acceso Denegado</h1>
          <p className="text-red-400">{error || "No tienes permiso para ver esta página."}</p>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="p-6 space-y-8 bg-slate-900 min-h-screen text-white">
        <h2 className="text-2xl font-bold text-center">Estadísticas de Usuarios</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Productos solicitados por usuario */}
          <Card className="bg-white text-black rounded-2xl shadow p-6 h-[28rem]">
            <h3 className="text-xl font-semibold mb-4">Solicitudes por usuario</h3>
            {productosPorUsuario.labels.length > 0 ? (
              <BarChart
                data={{
                  labels: productosPorUsuario.labels,
                  datasets: [
                    {
                      label: "Total Solicitado",
                      data: productosPorUsuario.data,
                      backgroundColor: "rgba(59, 130, 246, 0.6)",
                    },
                  ],
                  title: "Solicitudes por Usuario",
                }}
              />
            ) : (
              <p>No hay solicitudes registradas por usuario.</p>
            )}
          </Card>

          {/* Usuarios por rol */}
          <Card className="bg-white text-black rounded-2xl shadow p-6 h-[28rem]">
            <h3 className="text-xl font-semibold mb-4">Distribución de usuarios por rol</h3>
            {usuariosPorRol.labels.length > 0 ? (
              <BarChart
                data={{
                  labels: usuariosPorRol.labels,
                  datasets: [
                    {
                      label: "Cantidad de Usuarios",
                      data: usuariosPorRol.data,
                      backgroundColor: "rgba(34, 197, 94, 0.6)",
                    },
                  ],
                  title: "Usuarios por Rol",
                }}
              />
            ) : (
              <p>No hay datos disponibles de usuarios por rol.</p>
            )}
          </Card>
        </div>
      </div>
    </DefaultLayout>
  );
}
