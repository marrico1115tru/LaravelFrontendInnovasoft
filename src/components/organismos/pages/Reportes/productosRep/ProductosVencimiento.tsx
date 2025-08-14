import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import DefaultLayout from "@/layouts/default";
import Modal from "@/components/ui/Modal";
import api from "@/Api/api"; // ← Aquí usamos la instancia configurada

interface ProductoProximoVencer {
  id: number;
  nombre: string;
  fecha_vencimiento: string;
  stock_total: number;
}

interface ProductosProximosVencerResponse {
  data: ProductoProximoVencer[];
}

export default function ProductosProximosAVencer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data, isLoading, error } = useQuery<ProductosProximosVencerResponse>({
    queryKey: ["productos-proximos-vencer"],
    queryFn: async () => {
      const res = await api.get("/reportes/productos-proximos-vencer", {
        withCredentials: true,
      });
      return res.data;
    },
  });

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

    pdf.save("reporte_productos_proximos_vencer.pdf");
  };

  if (isLoading) return <p className="p-6">Cargando datos...</p>;
  if (error) return <p className="p-6 text-red-500">Error al cargar los datos.</p>;
  if (!data?.data) return <p className="p-6">No se encontraron datos.</p>;

  const productos = data.data;

  const ReportContent = () => (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-6xl mx-auto border border-gray-200">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-blue-800">INNOVASOFT</h2>
        <p className="text-sm text-gray-500">
          Reporte generado automáticamente —{" "}
          {new Date().toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
        <p className="mt-2 text-gray-700">
          Productos cuya fecha de vencimiento está próxima.
        </p>
      </div>

      {productos.length === 0 ? (
        <p className="text-center text-gray-600 text-lg py-10">
          No hay productos próximos a vencer.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-300">
            <thead className="bg-blue-100 text-blue-900 text-left text-sm font-semibold">
              <tr>
                <th className="border border-gray-300 px-4 py-2">#</th>
                <th className="border border-gray-300 px-4 py-2">Producto</th>
                <th className="border border-gray-300 px-4 py-2">Fecha de Vencimiento</th>
                <th className="border border-gray-300 px-4 py-2 text-right">Stock Total</th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-700">
              {productos.map((prod, index) => {
                let fechaFormateada = prod.fecha_vencimiento;
                if (prod.fecha_vencimiento?.includes("/")) {
                  const [day, month, year] = prod.fecha_vencimiento.split("/");
                  const fechaObj = new Date(+year, +month - 1, +day);
                  fechaFormateada = fechaObj.toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  });
                } else if (prod.fecha_vencimiento) {
                  fechaFormateada = new Date(prod.fecha_vencimiento).toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  });
                } else {
                  fechaFormateada = "Sin fecha";
                }

                return (
                  <tr key={prod.id || index} className="hover:bg-blue-50 transition-colors">
                    <td className="border border-gray-300 px-4 py-2">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-2">{prod.nombre}</td>
                    <td className="border border-gray-300 px-4 py-2">{fechaFormateada}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right">{prod.stock_total ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <DefaultLayout>
      <div className="p-8 bg-gray-50 min-h-screen">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900">Productos Próximos a Vencer</h1>
          <div className="flex gap-4">
            <Button
              onClick={() => setShowPreview(true)}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold px-4 py-2 rounded-lg shadow"
            >
              Previsualizar
            </Button>
            <Button
              onClick={exportarPDF}
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded-lg shadow"
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
            <div className="p-6 bg-white rounded-lg shadow-lg max-h-[80vh] overflow-auto">
              <div className="text-center mb-4">
                <h2 className="text-2xl font-bold text-blue-700">Previsualización del Reporte</h2>
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
