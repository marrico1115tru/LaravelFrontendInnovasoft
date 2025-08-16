"use client";

import { useQuery } from "@tanstack/react-query";
import { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import DefaultLayout from "@/layouts/default";
import Modal from "@/components/ui/Modal";
import api from "@/Api/api";
import Cookies from "js-cookie";
import { Lock } from "lucide-react";

interface UsuariosPorRolResponse {
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

export default function UsuariosPorRolCantidad() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [permisos, setPermisos] = useState({
    puede_ver: false,
    puede_crear: false,
    puede_editar: false,
    puede_eliminar: false,
  });
  const [errorPermiso, setErrorPermiso] = useState<string | null>(null);

  const {
    data,
    isLoading,
    isError,
  } = useQuery<UsuariosPorRolResponse>({
    queryKey: ["usuarios-por-rol"],
    queryFn: async () => {
      const { data } = await api.get("/estadisticas/usuarios-por-rol", {
        withCredentials: true,
      });
      return data;
    },
    enabled: permisos.puede_ver,
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        const userCookie = Cookies.get("user");
        if (!userCookie)
          throw new Error("No se encontró la sesión del usuario. Por favor, inicie sesión.");

        const user = JSON.parse(userCookie);
        const idRol = user?.id_rol;
        if (!idRol)
          throw new Error("El usuario no tiene un rol válido asignado.");

        const rutaActual = "/report/UsuariosRep/UsuariosPorRol";
        const permisosObtenidos = await fetchPermisos(rutaActual, idRol);
        setPermisos(permisosObtenidos);

        if (!permisosObtenidos.puede_ver) {
          setErrorPermiso("No tienes permiso para ver este reporte.");
        }
      } catch (e: any) {
        setErrorPermiso(e.message);
      }
    };
    initialize();
  }, []);

  const exportarPDF = async () => {
    if (!containerRef.current) return;

    const canvas = await html2canvas(containerRef.current, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png", 1.0);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pageWidth) / imgProps.width;

    let position = 0;
    if (pdfHeight > pageHeight) {
      while (position < pdfHeight) {
        pdf.addImage(imgData, "PNG", 0, -position, pageWidth, pdfHeight);
        position += pageHeight;
        if (position < pdfHeight) pdf.addPage();
      }
    } else {
      pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pdfHeight);
    }

    pdf.save("usuarios_por_rol.pdf");
  };

  if (isLoading) {
    return (
      <DefaultLayout>
        <div className="p-6 text-lg text-center">Cargando...</div>
      </DefaultLayout>
    );
  }

  if (isError || errorPermiso || !permisos.puede_ver) {
    return (
      <DefaultLayout>
        <div className="p-6 text-center text-red-600 flex flex-col items-center gap-4">
          <Lock size={48} />
          <h1 className="text-2xl font-bold">Acceso Denegado</h1>
          <p>{errorPermiso || "No tienes permiso para ver este reporte."}</p>
        </div>
      </DefaultLayout>
    );
  }

  const usuariosPorRol = data?.labels.map((rol, i) => ({
    nombreRol: rol,
    cantidad: data.data[i],
  })) || [];

  const ReportContent = () => (
    <div
      className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-3xl mx-auto space-y-6 border border-gray-200"
      ref={containerRef}
    >
      <table className="w-full text-sm border border-gray-300 rounded text-center">
        <thead className="bg-indigo-100 text-indigo-900 uppercase">
          <tr>
            <th className="px-4 py-2 border">Rol</th>
            <th className="px-4 py-2 border">Cantidad de usuarios</th>
          </tr>
        </thead>
        <tbody className="text-indigo-800 divide-y divide-gray-200">
          {usuariosPorRol.map((rol, i) => (
            <tr key={i} className="hover:bg-indigo-50 text-sm">
              <td className="px-4 py-2 border font-medium">{rol.nombreRol}</td>
              <td className="px-4 py-2 border">{rol.cantidad}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <DefaultLayout>
      <div className="p-10 bg-gradient-to-br from-blue-50 to-white min-h-screen">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 mb-2">
              Reporte de Usuarios por Rol
            </h1>
            <p className="text-gray-600 text-sm max-w-2xl">
              Este reporte muestra cuántos usuarios hay agrupados por su rol en el sistema.
            </p>
          </div>

          <div className="flex gap-4">
            <Button
              onClick={() => setShowPreview(true)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg shadow"
            >
              Previsualizar
            </Button>
            <Button
              onClick={exportarPDF}
              className="bg-indigo-700 hover:bg-indigo-800 text-white px-4 py-2 rounded-lg shadow"
            >
              Exportar PDF
            </Button>
          </div>
        </div>

        <ReportContent />

        {showPreview && (
          <Modal onClose={() => setShowPreview(false)}>
            <div className="p-6 bg-white rounded-lg shadow-lg max-h-[80vh] overflow-auto">
              <div className="text-center mb-4">
                <h2 className="text-xl font-bold text-indigo-700">
                  Previsualización del Reporte
                </h2>
              </div>
              <hr className="my-2 border-gray-200" />
              <ReportContent />
            </div>
          </Modal>
        )}
      </div>
    </DefaultLayout>
  );
}
