import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Shield, Home, Phone, IdCard } from "lucide-react";
import DefaultLayout from "@/layouts/default";

interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  email: string;
  telefono: string;
  id_area: number;
  id_rol: number;
  created_at: string;
}

const Perfil = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const fetchPerfil = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/perfil", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUsuario(response.data);
      } catch (err: any) {
        console.error("Error cargando perfil:", err);
        setError("No se pudo cargar el perfil");
      } finally {
        setLoading(false);
      }
    };

    fetchPerfil();
  }, [navigate]);

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <p className="text-slate-600 text-lg animate-pulse">
            Cargando perfil...
          </p>
        </div>
      </DefaultLayout>
    );
  }

  if (error || !usuario) {
    return (
      <DefaultLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <Card className="p-8 bg-white/70 backdrop-blur-lg shadow-2xl rounded-3xl text-center border border-slate-200">
            <p className="text-red-500 font-medium mb-4">
              {error || "Usuario no encontrado"}
            </p>
            <Button
              onClick={() => navigate("/Home")}
              className="bg-blue-800 hover:bg-blue-900 text-white px-6 py-2 rounded-lg shadow-md"
            >
              <Home className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          </Card>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="flex items-center justify-center py-10">
        <Card className="w-full max-w-lg bg-white/70 backdrop-blur-xl shadow-2xl rounded-3xl border border-slate-200">
          <CardContent className="p-10 flex flex-col items-center">

           
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-wide capitalize">
              {usuario.nombre} {usuario.apellido}
            </h2>
            <div className="mt-6 space-y-2 text-slate-700">
              <p className="flex items-center">
                <Mail className="mr-2 h-4 w-4 text-blue-700" />
                <span>{usuario.email}</span>
              </p>
              <p className="flex items-center">
                <Phone className="mr-2 h-4 w-4 text-blue-700" />
                <span>{usuario.telefono}</span>
              </p>
              <p className="flex items-center">
                <IdCard className="mr-2 h-4 w-4 text-blue-700" />
                <span>{usuario.cedula}</span>
              </p>
              <p className="flex items-center">
                <Shield className="mr-2 h-4 w-4 text-blue-700" />
                <span className="font-medium">Rol:</span> {usuario.id_rol || "No asignado"}
              </p>
              <p>
                <span className="font-medium">Área:</span> {usuario.id_area}
              </p>
            </div>

           
            <p className="text-sm text-gray-500 mt-6">
              Miembro desde:{" "}
              {new Date(usuario.created_at).toLocaleDateString("es-ES")}
            </p>

            
            <div className="mt-8">
              <Button
                onClick={() => navigate("/Home")}
                className="bg-blue-800 hover:bg-blue-900 text-white px-6 py-2 rounded-xl shadow-lg flex items-center"
              >
                <Home className="mr-2 h-5 w-5" />
                Volver al inicio
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DefaultLayout>
  );
};

export default Perfil;
