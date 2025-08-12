'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BarChart } from './Graficasbases/GraficasBaseProductos';
import { Card } from '@/components/ui/card';
import DefaultLayout from '@/layouts/default';

const VistaEstadisticasProductos: React.FC = () => {
  const [labelsSolicitados, setLabelsSolicitados] = useState<string[]>([]);
  const [valuesSolicitados, setValuesSolicitados] = useState<number[]>([]);
  const [labelsMovimientos, setLabelsMovimientos] = useState<string[]>([]);
  const [valuesMovimientos, setValuesMovimientos] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEstadisticas = async () => {
      try {
        const config = { withCredentials: true };

        const [resSolicitados, resMovimientos] = await Promise.all([
          axios.get('http://127.0.0.1:8000/api/estadistica/mas-solicitados', config),
          axios.get('http://127.0.0.1:8000/api/estadisticas/mayor-movimiento', config),
        ]);

        // Validar y mapear los datos de "más solicitados"
        if (
          resSolicitados.data &&
          Array.isArray(resSolicitados.data.labels) &&
          Array.isArray(resSolicitados.data.data)
        ) {
          setLabelsSolicitados(resSolicitados.data.labels);
          setValuesSolicitados(resSolicitados.data.data.map((v: any) => Number(v) || 0));
        }

        // Validar y mapear los datos de "mayor movimiento"
        if (
          resMovimientos.data &&
          Array.isArray(resMovimientos.data.labels) &&
          Array.isArray(resMovimientos.data.data)
        ) {
          setLabelsMovimientos(resMovimientos.data.labels);
          setValuesMovimientos(resMovimientos.data.data.map((v: any) => Number(v) || 0));
        }
      } catch (err) {
        setError('Error al obtener estadísticas de productos');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEstadisticas();
  }, []);

  const dataBarSolicitados = {
    labels: labelsSolicitados,
    datasets: [
      {
        label: 'Cantidad solicitada',
        data: valuesSolicitados,
        backgroundColor: labelsSolicitados.map(() => '#3B82F6'),
      },
    ],
    title: 'Productos más solicitados',
  };

  const dataBarMovimientos = {
    labels: labelsMovimientos,
    datasets: [
      {
        label: 'Movimientos',
        data: valuesMovimientos,
        backgroundColor: labelsMovimientos.map(() => '#F59E0B'),
      },
    ],
    title: 'Productos con mayor movimiento',
  };

  return (
    <DefaultLayout>
      <div className="p-6 bg-[#0f172a] min-h-screen">
        <h1 className="text-white text-3xl font-bold mb-6 text-center">
          Estadísticas de Productos
        </h1>

        {loading && <p className="text-white text-center">Cargando estadísticas...</p>}
        {error && <p className="text-red-500 text-center">{error}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white text-gray-900 rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-2 text-center">Productos más solicitados</h2>
              <p className="text-sm text-gray-600 text-center mb-4">
                Cantidad de productos solicitados por los usuarios
              </p>
              <div className="max-w-2xl mx-auto h-96">
                <BarChart data={dataBarSolicitados} />
              </div>
            </Card>

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
        )}
      </div>
    </DefaultLayout>
  );
};

export default VistaEstadisticasProductos;
