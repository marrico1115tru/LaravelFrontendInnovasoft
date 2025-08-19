import { useState } from "react";
import axios from "axios";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function RecuperarContraseña() {
  const [step, setStep] = useState<"email" | "reset" | "success">("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/forgot-password", { email });
      setMessage(res.data.message || "Correo enviado. Revisa tu bandeja.");
      setStep("reset");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Error al enviar email");
    }
    setLoading(false);
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      setMessage("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/api/reset-password", {
        token,
        email,
        password,
        password_confirmation: passwordConfirm,
      });
      setMessage(res.data.message || "Contraseña actualizada con éxito.");
      setStep("success");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Error al cambiar contraseña");
    }
    setLoading(false);
  };

  return (
    <div
      className="h-screen w-full bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url('/src/img/bodegas.jpeg')` }}
    >
      <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 p-10 rounded-xl shadow-2xl max-w-md w-full text-gray-100">
        <h2 className="text-center text-2xl font-bold mb-6 text-white">
          Recuperar Contraseña
        </h2>

        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <label className="text-sm text-white/80">Correo electrónico</label>
            <Input
              type="email"
              placeholder="Ingrese su correo"
              className="bg-slate-800 text-white placeholder-white/60 border border-slate-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold"
            >
              {loading ? "Enviando..." : "Enviar enlace"}
            </Button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetSubmit} className="space-y-4">
            <label className="text-sm text-white/80">Token recibido en el correo</label>
            <Input
              type="text"
              placeholder="Pega aquí el token"
              className="bg-slate-800 text-white placeholder-white/60 border border-slate-600"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
            />
            <label className="text-sm text-white/80">Nueva contraseña</label>
            <Input
              type="password"
              placeholder="Ingrese su nueva contraseña"
              className="bg-slate-800 text-white placeholder-white/60 border border-slate-600"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <label className="text-sm text-white/80">Confirmar contraseña</label>
            <Input
              type="password"
              placeholder="Confirme la contraseña"
              className="bg-slate-800 text-white placeholder-white/60 border border-slate-600"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              required
            />
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-green-700 hover:bg-green-800 text-white font-semibold"
            >
              {loading ? "Actualizando..." : "Actualizar contraseña"}
            </Button>
          </form>
        )}

        {step === "success" && (
          <div className="text-center space-y-4">
            <p className="text-green-400 font-semibold text-lg">
              ✅ Contraseña recuperada correctamente
            </p>
            <Button
              onClick={() => navigate("/")}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold"
            >
              Volver al inicio
            </Button>
          </div>
        )}

        {message && step !== "success" && (
          <p className="text-center text-sm mt-4 text-yellow-400">{message}</p>
        )}
      </div>
    </div>
  );
}
