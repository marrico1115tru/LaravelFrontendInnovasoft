import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaEnvelope } from "react-icons/fa";

const RecuperarContraseña = () => {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [nuevaPass, setNuevaPass] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const resetMessages = () => {
    setMensaje('');
    setError('');
  };

  // Envía solicitud para recuperar contraseña
  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsLoading(true);
    if (!email.trim()) {
      setError('El correo es obligatorio.');
      setIsLoading(false);
      return;
    }
    try {
      const res = await fetch('http://localhost:3000/auth/recuperar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || 'Error al enviar el correo');
        return;
      }
      setMensaje('📩 Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.');
      setShowModal(true);
    } catch (error) {
      setError('Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  // Maneja actualización de contraseña con código
  const handleActualizarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsLoading(true);

    if (!email.trim()) {
      setError('El correo es obligatorio para actualizar la contraseña.');
      setIsLoading(false);
      return;
    }
    if (!codigo.trim() || codigo.trim().length < 4) {
      setError('El código debe tener al menos 4 caracteres.');
      setIsLoading(false);
      return;
    }
    if (!nuevaPass.trim() || nuevaPass.trim().length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        email: email.trim(),
        codigo: codigo.trim(),
        nuevaPassword: nuevaPass.trim(),
      };
      const res = await fetch('http://localhost:3000/auth/verificar-codigo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || data.error || 'Error al verificar el código');
        return;
      }
      setMensaje('✅ Contraseña actualizada correctamente.');
      setCodigo('');
      setNuevaPass('');
      setShowModal(false);
      setEmail('');
    } catch (error) {
      setError('Error al conectar con el servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-slate-900">
      <div className="bg-slate-800 p-10 rounded-lg shadow-lg w-full max-w-md text-white">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Recuperar contraseña
        </h2>

        <form onSubmit={handleRecuperar} noValidate>
          <label htmlFor="email" className="block mb-2 text-sm text-white/80">
            Correo electrónico
          </label>
          <div className="relative mb-4">
            <span className="absolute left-3 top-2.5 text-gray-400">
              <FaEnvelope />
            </span>
            <Input
              id="email"
              type="email"
              placeholder="Ingrese su correo"
              className="pl-10 bg-slate-700 text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              disabled={isLoading || showModal}
              required
            />
          </div>

          {mensaje && <p className="text-green-500 text-sm mb-2 text-center">{mensaje}</p>}
          {error && <p className="text-red-500 text-sm mb-2 text-center">{error}</p>}

          <Button
            type="submit"
            disabled={isLoading || showModal}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? 'Enviando...' : 'Enviar enlace'}
          </Button>
        </form>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <form
            onSubmit={handleActualizarPassword}
            className="bg-slate-800 p-8 rounded-lg shadow-lg w-full max-w-sm text-white"
            noValidate
          >
            <h3 className="text-xl font-semibold mb-4 text-center">
              Verifica tu identidad
            </h3>

            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            <label htmlFor="codigo" className="block mb-2 text-sm">
              Código de verificación
            </label>
            <Input
              id="codigo"
              type="text"
              placeholder="Código recibido"
              className="mb-4 bg-slate-700 text-white"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              autoComplete="one-time-code"
              disabled={isLoading}
              required
            />

            <label htmlFor="nuevaPass" className="block mb-2 text-sm">
              Nueva contraseña
            </label>
            <Input
              id="nuevaPass"
              type="password"
              placeholder="Nueva contraseña"
              className="mb-4 bg-slate-700 text-white"
              value={nuevaPass}
              onChange={(e) => setNuevaPass(e.target.value)}
              autoComplete="new-password"
              disabled={isLoading}
              required
              minLength={6}
            />

            <div className="flex gap-2">
              <Button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={isLoading}
              >
                {isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  resetMessages();
                  setCodigo('');
                  setNuevaPass('');
                }}
                className="w-full bg-red-600 hover:bg-red-700"
                variant="outline"
                disabled={isLoading}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RecuperarContraseña;
