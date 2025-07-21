import { useEffect, useState } from "react";
import DefaultLayout from "@/layouts/default";
import axios from "@/Api/axios";

interface Rol {
  id: number;
  nombreRol: string;
}

interface Opcion {
  id: number;
  nombreOpcion: string;
  rutaFrontend: string;
}

interface Modulo {
  id: number;
  nombreModulo: string;
  opciones: Opcion[];
}

interface Permiso {
  id: number;
  puedeVer: boolean;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  opcion: Opcion;
}

type CampoPermiso = "puedeVer" | "puedeCrear" | "puedeEditar" | "puedeEliminar";

export default function GestionPermisosPage() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [rolSeleccionado, setRolSeleccionado] = useState<number | null>(null);
  const [modulosConPermisos, setModulosConPermisos] = useState<Modulo[]>([]);
  const [modulosTotales, setModulosTotales] = useState<Modulo[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormularioNuevo, setMostrarFormularioNuevo] = useState(false);
  const [nuevoPermiso, setNuevoPermiso] = useState({
    id_opcion: "",
    puedeVer: false,
    puedeCrear: false,
    puedeEditar: false,
    puedeEliminar: false,
  });

  // Estado para modal lista módulos no asignados
  const [mostrarModuloNoAsignado, setMostrarModuloNoAsignado] = useState(false);

  // Carga inicial roles y todos los módulos (para permitir activar)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resRoles, resModulos] = await Promise.all([
          axios.get("/roles"),
          axios.get("/modulos/con-opciones"),
        ]);
        setRoles(resRoles.data);
        setModulosTotales(resModulos.data);
      } catch {
        alert("Error cargando roles o módulos");
      }
    };
    fetchData();
  }, []);

  // Al cambiar rol, cargar permisos + módulos con permisos para ese rol
  useEffect(() => {
    if (rolSeleccionado) {
      cargarPermisos();
      cargarModulosConPermisos();
    }
  }, [rolSeleccionado]);

  const cargarPermisos = async () => {
    try {
      const res = await axios.get(`/permisos/rol/${rolSeleccionado}`);
      setPermisos(res.data.data);
    } catch {
      alert("Error al obtener permisos");
    }
  };

  // Obtener modulos que tienen permisos asignados, mediante permisos
  const cargarModulosConPermisos = async () => {
    try {
      // Usamos endpoint que da módulos con permisos asignados para el rol
      const res = await axios.get(`/permisos/modulos/${rolSeleccionado}`);
      // Este endpoint devuelve: [{id, nombremodulo}]
      const modulosRolIds = res.data.map((m: any) => m.id);

      // Filtrar módulos totales solo los asignados
      setModulosConPermisos(modulosTotales.filter(m => modulosRolIds.includes(m.id)));
    } catch {
      alert("Error cargando módulos con permisos para el rol");
    }
  };

  const getPermiso = (opcionId: number) => permisos.find((p) => p.opcion.id === opcionId);

  const handleCheckboxChange = (
    opcionId: number,
    campo: CampoPermiso,
    value: boolean
  ) => {
    setPermisos((prev) =>
      prev.map((permiso) =>
        permiso.opcion.id === opcionId ? { ...permiso, [campo]: value } : permiso
      )
    );
  };

  const eliminarPermiso = async (permiso: Permiso) => {
    if (!confirm("¿Seguro de eliminar este permiso?")) return;
    try {
      await axios.delete(`/permisos/${permiso.id}`);
      setPermisos((prev) => prev.filter((p) => p.id !== permiso.id));
      alert("Permiso eliminado");
      cargarModulosConPermisos();
    } catch {
      alert("Error eliminando permiso");
    }
  };

  // "Eliminar módulo" = eliminar todos permisos del módulo para rol
  const eliminarModulo = async (moduloId: number, nombreModulo: string) => {
    if (!rolSeleccionado) {
      alert("Selecciona un rol primero");
      return;
    }
    if (
      !confirm(
        `¿Seguro que deseas eliminar TODOS los permisos del módulo "${nombreModulo}" para el rol seleccionado?`
      )
    )
      return;

    try {
      await axios.delete(`/permisos/modulo/${moduloId}/rol/${rolSeleccionado}`);
      alert(`Permisos del módulo "${nombreModulo}" eliminados correctamente`);
      cargarPermisos();
      cargarModulosConPermisos();
    } catch {
      alert("Error eliminando permisos del módulo");
    }
  };

  // Mostrar lista modulos NO asignados para el rol para crear permisos
  const modulosNoAsignados = modulosTotales.filter(
    (m) => !modulosConPermisos.some((mm) => mm.id === m.id)
  );

  // Crear permiso nuevo desde formulario
  const crearPermiso = async () => {
    try {
      if (!rolSeleccionado || !nuevoPermiso.id_opcion) {
        alert("Debes seleccionar un rol y una opción");
        return;
      }
      await axios.post("/permisos", {
        id_rol: rolSeleccionado,
        id_opcion: Number(nuevoPermiso.id_opcion),
        puedeVer: nuevoPermiso.puedeVer,
        puedeCrear: nuevoPermiso.puedeCrear,
        puedeEditar: nuevoPermiso.puedeEditar,
        puedeEliminar: nuevoPermiso.puedeEliminar,
      });
      alert("Permiso creado correctamente");
      setNuevoPermiso({
        id_opcion: "",
        puedeVer: false,
        puedeCrear: false,
        puedeEditar: false,
        puedeEliminar: false,
      });
      setMostrarFormularioNuevo(false);
      cargarPermisos();
      cargarModulosConPermisos();
    } catch {
      alert("Error al crear permiso");
    }
  };

  const guardarPermisos = async () => {
    try {
      setGuardando(true);
      const permisosAEnviar = permisos.map((p) => ({
        id: p.id,
        puedeVer: p.puedeVer,
        puedeCrear: p.puedeCrear,
        puedeEditar: p.puedeEditar,
        puedeEliminar: p.puedeEliminar,
      }));
      await axios.put("/permisos/actualizar-masivo", { permisos: permisosAEnviar });
      alert("Permisos actualizados correctamente");
      cargarPermisos();
    } catch {
      alert("Error al guardar permisos");
    } finally {
      setGuardando(false);
    }
  };

  const renderFormularioNuevo = () => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        crearPermiso();
      }}
      className="p-4 border border-gray-300 rounded-md space-y-2"
    >
      <div>
        <label className="block text-sm mb-1 font-medium">Opción:</label>
        <select
          className="w-full border px-2 py-1 rounded"
          value={nuevoPermiso.id_opcion}
          onChange={(e) =>
            setNuevoPermiso({ ...nuevoPermiso, id_opcion: e.target.value })
          }
        >
          <option value="">-- Selecciona opción --</option>
          {modulosTotales.flatMap((modulo) =>
            modulo.opciones.map((op) => (
              <option key={op.id} value={op.id}>
                {modulo.nombreModulo} / {op.nombreOpcion}
              </option>
            ))
          )}
        </select>
      </div>

      {(["puedeVer", "puedeCrear", "puedeEditar", "puedeEliminar"] as CampoPermiso[]).map(
        (campo) => (
          <label key={campo} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={nuevoPermiso[campo]}
              onChange={(e) =>
                setNuevoPermiso({ ...nuevoPermiso, [campo]: e.target.checked })
              }
            />
            <span>{campo}</span>
          </label>
        )
      )}

      <button
        type="submit"
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Guardar Permiso
      </button>
    </form>
  );

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800">
          Gestión de Permisos por Rol y Módulo
        </h1>

        {/* Selector de rol */}
        <div className="max-w-sm space-y-2">
          <label className="block text-sm font-medium text-gray-700">Selecciona un rol:</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            onChange={(e) => setRolSeleccionado(Number(e.target.value))}
            value={rolSeleccionado ?? ""}
          >
            <option value="" disabled>
              -- Selecciona --
            </option>
            {roles.map((rol) => (
              <option key={rol.id} value={rol.id}>
                {rol.nombreRol}
              </option>
            ))}
          </select>
        </div>

        {rolSeleccionado && (
          <>
            <button
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              onClick={() => setMostrarModuloNoAsignado((m) => !m)}
            >
              {mostrarModuloNoAsignado ? "Cerrar lista módulos no asignados" : "Listar módulos no asignados"}
            </button>

            {mostrarModuloNoAsignado && (
              <div className="border p-4 mt-4 rounded max-h-80 overflow-auto bg-gray-50">
                <h2 className="font-semibold mb-2 text-gray-700">Módulos sin permisos asignados para este rol</h2>
                {modulosNoAsignados.length === 0 && <p className="text-gray-500">No hay módulos no asignados.</p>}
                <ul>
                  {modulosNoAsignados.map(modulo => (
                    <li key={modulo.id} className="mb-1 flex justify-between items-center">
                      <span>{modulo.nombreModulo}</span>
                      <button
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                        onClick={() => {
                          // Aquí puedes abrir modal para crear permisos para todas las opciones del módulo o ir a formulario
                          // Por simplicidad, se abre el formulario para que el usuario seleccione las opciones
                          alert(`Para crear permisos en módulo '${modulo.nombreModulo}', usa el formulario de 'Crear nuevo permiso'.`);
                        }}
                        type="button"
                      >
                        Crear permisos
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-6 mt-4">
              <button
                onClick={() => setMostrarFormularioNuevo((prev) => !prev)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                {mostrarFormularioNuevo ? "Cancelar" : "Crear nuevo permiso"}
              </button>

              {mostrarFormularioNuevo && renderFormularioNuevo()}

              {modulosConPermisos.map((modulo) => (
                <div key={modulo.id} className="mb-6 border border-gray-300 rounded p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-lg">{modulo.nombreModulo}</span>
                    <button
                      onClick={() => eliminarModulo(modulo.id, modulo.nombreModulo)}
                      className="text-red-600 hover:underline text-sm"
                      type="button"
                    >
                      Eliminar Módulo
                    </button>
                  </div>

                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left w-1/2">Opción</th>
                        <th className="px-4 py-2 text-center">Ver</th>
                        <th className="px-4 py-2 text-center">Crear</th>
                        <th className="px-4 py-2 text-center">Editar</th>
                        <th className="px-4 py-2 text-center">Eliminar</th>
                        <th className="px-4 py-2 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {modulo.opciones.map((opcion) => {
                        const permiso = getPermiso(opcion.id);
                        return (
                          <tr key={opcion.id}>
                            <td className="px-4">
                              <div className="font-semibold">{opcion.nombreOpcion}</div>
                              <div className="text-xs text-gray-400">{opcion.rutaFrontend}</div>
                            </td>
                            {(["puedeVer", "puedeCrear", "puedeEditar", "puedeEliminar"] as CampoPermiso[]).map(
                              (campo) => (
                                <td key={campo} className="px-4 py-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={permiso ? permiso[campo] : false}
                                    disabled={!permiso}
                                    onChange={(e) =>
                                      permiso && handleCheckboxChange(opcion.id, campo, e.target.checked)
                                    }
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                  />
                                </td>
                              )
                            )}
                            <td className="px-4 py-2 text-center">
                              {permiso ? (
                                <button
                                  className="text-red-600 hover:underline text-xs"
                                  onClick={() => eliminarPermiso(permiso)}
                                >
                                  Eliminar
                                </button>
                              ) : (
                                <span className="text-gray-400 text-xs">Sin permiso</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={guardarPermisos}
                disabled={guardando}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow"
              >
                {guardando ? "Guardando..." : "Guardar Permisos"}
              </button>
            </div>
          </>
        )}
      </div>
    </DefaultLayout>
  );
}
