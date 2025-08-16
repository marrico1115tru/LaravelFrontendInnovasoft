"use client";

import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import DefaultLayout from "@/layouts/default";
import Modal from "@/components/ui/Modal";
import api from "@/Api/api";
import Cookies from "js-cookie";
import { Lock } from "lucide-react";

interface ReportePorSitioResponse {
  labels: string[];
  data: (string | number)[];
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

export default function ProductosPorSitio() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [permisos, setPermisos] = useState({
    puede_ver: false,
    puede_crear: false,
    puede_editar: false,
    puede_eliminar: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Usamos react-query para la llamada al api
  const { data, isLoading, isError } = useQuery<ReportePorSitioResponse>({
    queryKey: ["productos-por-sitio"],
    queryFn: async () => {
      const res = await api.get<ReportePorSitioResponse>("/reporte-por-sitio/productos");
      return res.data;
    },
    enabled: permisos.puede_ver, // corre sólo si puede_ver es true
  });

  // Cargar permisos al montar
  useEffect(() => {
    const initialize = async () => {
      try {
        const userCookie = Cookies.get("user");
        if (!userCookie) throw new Error("No se encontró la sesión del usuario. Por favor, inicie sesión.");

        const user = JSON.parse(userCookie);
        const idRol = user?.id_rol;
        if (!idRol) throw new Error("El usuario no tiene un rol válido asignado.");

        const rutaActual = "/report/productosRep/ProductosPorSitio";
        const permisosObtenidos = await fetchPermisos(rutaActual, idRol);
        setPermisos(permisosObtenidos);

        if (!permisosObtenidos.puede_ver) {
          setError("No tienes permiso para ver este reporte.");
        }
      } catch (e: any) {
        setError(e.message);
      }
    };

    initialize();
  }, []);

  const exportarPDF = async () => {
    if (!containerRef.current) return;

    const canvas = await html2canvas(containerRef.current, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();

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

    pdf.save("reporte_productos_por_sitio.pdf");
  };

  const ReportContent = () => (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold text-blue-800">INNOVASOFT</h2>
        <p className="text-lg text-gray-600">Reporte de Productos por Sitio</p>
        <p className="text-sm text-gray-500 mt-1">Generado automáticamente — {new Date().toLocaleDateString()}</p>
        <hr className="my-4 border-t-2 border-gray-200" />
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-blue-800 text-white">
            <th className="p-3 border border-gray-300 text-left">#</th>
            <th className="p-3 border border-gray-300 text-left">Sitio</th>
            <th className="p-3 border border-gray-300 text-right">Stock</th>
          </tr>
        </thead>
        <tbody>
          {data?.labels.map((sitio, index) => (
            <tr key={index} className="hover:bg-gray-100">
              <td className="p-3 border border-gray-300">{index + 1}</td>
              <td className="p-3 border border-gray-300">{sitio}</td>
              <td className="p-3 border border-gray-300 text-right">{data.data[index]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (isLoading) {
    return (
      <DefaultLayout>
        <div className="p-6">Cargando datos...</div>
      </DefaultLayout>
    );
  }

  if (isError || error || !permisos.puede_ver) {
    return (
      <DefaultLayout>
        <div className="p-6 text-center text-red-600 flex flex-col items-center gap-4">
          <Lock size={48} />
          <h1 className="text-2xl font-bold">Acceso Denegado</h1>
          <p>{error || "No tienes permiso para ver este reporte."}</p>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="p-8 bg-blue-50 min-h-screen">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-blue-800">Productos por Sitio</h1>
          <div className="flex gap-4">
            <Button
              onClick={() => setShowPreview(true)}
              className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Previsualizar
            </Button>
            <Button
              onClick={exportarPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
            >
              Exportar PDF
            </Button>
          </div>
        </div>

        <div ref={containerRef}>
          <ReportContent />
        </div>

        {showPreview && (
          <Modal onClose={() => setShowPreview(false)}>
            <div className="p-6 max-h-[80vh] overflow-auto bg-white rounded-lg shadow-lg">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-blue-700">Previsualización del Reporte</h2>
              </div>
              <hr className="my-2 border-t-2 border-gray-200" />
              <div className="p-4">
                <ReportContent />
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DefaultLayout>
  );
}
