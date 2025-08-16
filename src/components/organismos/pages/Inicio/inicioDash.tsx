import DefaultLayout from "@/layouts/default";
import { Card } from "@/components/ui/card";
import {
  UserGroupIcon,
  CubeIcon,
  Squares2X2Icon,
  ChartBarSquareIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useKeenSlider } from "keen-slider/react";
import { useDashboardData } from "@/Api/Dashboard/DashboardData";
import "keen-slider/keen-slider.min.css";

const images = [
  { id: 1, title: "Agropecuario", src: "src/img/agropecuarioimg.jpeg", link: "/agropecuario" },
  { id: 2, title: "Ambiental", src: "src/img/ambientalimg.jpeg", link: "/ambiental" },
  { id: 3, title: "Tecnología", src: "src/img/ticsimg.jpeg", link: "/tic" },
  { id: 4, title: "Escuela de Café", src: "src/img/cafeimg.jpeg", link: "/EscuelaCafe" },
  { id: 5, title: "Vias", src: "src/img/viasimg.jpeg", link: "/vias" },
];

function AutoplayPlugin(slider: any) {
  let timeout: ReturnType<typeof setTimeout>;
  let mouseOver = false;

  function clearNextTimeout() {
    clearTimeout(timeout);
  }
  function nextTimeout() {
    clearTimeout(timeout);
    if (mouseOver) return;
    timeout = setTimeout(() => {
      slider.next();
    }, 2500);
  }
  slider.on("created", () => {
    slider.container.addEventListener("mouseover", () => {
      mouseOver = true;
      clearNextTimeout();
    });
    slider.container.addEventListener("mouseout", () => {
      mouseOver = false;
      nextTimeout();
    });
    nextTimeout();
  });
  slider.on("dragStarted", clearNextTimeout);
  slider.on("animationEnded", nextTimeout);
  slider.on("updated", nextTimeout);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [sliderRef] = useKeenSlider(
    {
      loop: true,
      slides: { perView: 1.2, origin: "center", spacing: 16 },
      breakpoints: {
        "(min-width: 640px)": { slides: { perView: 1.5, origin: "center", spacing: 24 } },
        "(min-width: 1024px)": { slides: { perView: 2.5, origin: "center", spacing: 32 } },
      },
    },
    [AutoplayPlugin]
  );

  const { data, loading } = useDashboardData();

  const recentActivity =
    data?.productos
      ?.sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime())
      .slice(0, 5)
      .map((p) => ({
        fecha: new Date(p.fecha_creacion).toLocaleDateString(),
        actividad: `Producto creado: ${p.nombre}`,
      })) || [];

  return (
    <DefaultLayout>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 px-4 py-10">
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold text-slate-800 mb-2 tracking-tight drop-shadow">
            ¡Bienvenido!
          </h1>
          <p className="text-slate-500 text-lg">Visualiza el resumen del sistema de inventario.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <Card className="glass-card hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total de Usuarios</p>
                <h2 className="text-3xl font-bold text-gray-900">{loading ? "..." : data.totalUsuarios}</h2>
              </div>
              <div className="icon-glass">
                <UserGroupIcon className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </Card>
          <Card className="glass-card hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Productos</p>
                <h2 className="text-3xl font-bold text-gray-900">{loading ? "..." : data.totalProductos}</h2>
              </div>
              <div className="icon-glass">
                <CubeIcon className="h-8 w-8 text-emerald-600" />
              </div>
            </div>
          </Card>
          <Card className="glass-card hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Áreas</p>
                <h2 className="text-3xl font-bold text-gray-900">{loading ? "..." : data.totalAreas}</h2>
              </div>
              <div className="icon-glass">
                <Squares2X2Icon className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </Card>
          <Card className="glass-card hover:scale-105 transition-transform duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Resumen</p>
                <h2 className="text-3xl font-bold text-gray-900">
                  {loading
                    ? "..."
                    : Math.floor(
                        ((data.totalUsuarios + data.totalProductos + data.totalAreas) / 500) * 100
                      ) + "%"}
                </h2>
              </div>
              <div className="icon-glass">
                <ChartBarSquareIcon className="h-8 w-8 text-fuchsia-600" />
              </div>
            </div>
          </Card>
        </div>

        <div className="mb-14">
          <h2 className="text-2xl font-bold mb-5 text-slate-700 border-b pb-2 border-gray-200">Galería Destacada</h2>
          <div ref={sliderRef} className="keen-slider rounded-2xl overflow-visible shadow-lg" style={{ maxWidth: "100%", height: "240px" }}>
            {images.map((img) => (
              <div key={img.id} className="keen-slider__slide cursor-pointer relative h-full" onClick={() => navigate(img.link)}>
                <img src={img.src} alt={img.title} className="w-full h-full object-cover rounded-2xl shadow transition-transform duration-300 hover:scale-105" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent text-white text-center py-2 text-lg font-semibold rounded-b-2xl">{img.title}</div>
              </div>
            ))}
          </div>
        </div>

        <Card className="glass-card p-8 mt-10">
          <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2 border-gray-200">Últimas Actividades</h2>
          <ul className="space-y-3 text-base">
            {recentActivity.map((item, idx) => (
              <li key={idx} className="flex justify-between text-gray-700">
                <span>{item.actividad}</span>
                <span className="text-gray-400">{item.fecha}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <style>{`
        .glass-card {
          background: rgba(255,255,255,0.82);
          backdrop-filter: blur(10px);
          border-radius: 1.2rem;
          box-shadow: 0 4px 24px 0 rgba(16, 185, 129, 0.07);
          border: 1px solid rgba(200,200,200,0.13);
        }
        .icon-glass {
          background: rgba(236, 239, 241, 0.9);
          border-radius: 9999px;
          padding: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px 0 rgba(59,130,246,0.09);
        }
      `}</style>
    </DefaultLayout>
  );
}
