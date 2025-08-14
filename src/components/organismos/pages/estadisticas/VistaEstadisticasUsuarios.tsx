
import { useEffect, useState } from "react";
import { BarChart } from "./Graficasbases/GraficasBaseProductos";
import api from "@/Api/api"; 
import DefaultLayout from "@/layouts/default";

interface ChartData {
  labels: string[];
  data: number[];
}

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

  useEffect(() => {
    const fetchData = async () => {
      try {
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
      } catch (err) {
        setError("Error al obtener datos de estadísticas.");
        console.error("❌ Error en VistaEstadisticasUsuarios:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <DefaultLayout>
      <div className="p-6 space-y-8 bg-slate-900 min-h-screen text-white">
        <h2 className="text-2xl font-bold text-center">
          Estadísticas de Usuarios
        </h2>

        {loading && <div className="text-gray-300">Cargando datos...</div>}
        {error && <div className="text-red-500">{error}</div>}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Productos solicitados por usuario */}
            <div className="bg-white text-black rounded-2xl shadow p-6 h-[28rem]">
              <h3 className="text-xl font-semibold mb-4">
                Solicitudes por usuario
              </h3>
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
            </div>

            {/* Usuarios por rol */}
            <div className="bg-white text-black rounded-2xl shadow p-6 h-[28rem]">
              <h3 className="text-xl font-semibold mb-4">
                Distribución de usuarios por rol
              </h3>
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
            </div>
          </div>
        )}
      </div>
    </DefaultLayout>
  );
}
