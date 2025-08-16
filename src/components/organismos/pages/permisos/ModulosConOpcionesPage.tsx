import { useEffect, useState } from "react";
import DefaultLayout from "@/layouts/default";
import api from "@/Api/api";
import { AxiosError } from "axios";

// --- INTERFACES ---

interface Rol {
  id: number;
  nombre_rol: string;
}

interface Opcion {
  id_modulo: number;
  id: number;
  nombre_opcion: string;
  ruta_frontend?: string;
}

interface ModuloBase {
    id: number;
    nombre_modulo: string;
    opciones: Opcion[];
}

interface OpcionConPermisos extends Opcion {
    permisoId: number;
    puede_ver: boolean;
    puede_crear: boolean;
    puede_editar: boolean;
    puede_eliminar: boolean;
}

interface ModuloParaMostrar {
  id: number;
  nombre_modulo: string;
  opciones: OpcionConPermisos[];
}

interface Permiso {
  id: number;
  id_rol: number;
  id_opcion: number;
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
}

type CampoPermiso = "puede_ver" | "puede_crear" | "puede_editar" | "puede_eliminar";

export default function GestionPermisosPage() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [rolSeleccionado, setRolSeleccionado] = useState<number | null>(null);
  const [modulosTotales, setModulosTotales] = useState<ModuloBase[]>([]);
  const [permisosDelRol, setPermisosDelRol] = useState<Permiso[]>([]);
  const [modulosParaMostrar, setModulosParaMostrar] = useState<ModuloParaMostrar[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [mostrarFormularioNuevo, setMostrarFormularioNuevo] = useState(false);

  const [nuevoPermiso, setNuevoPermiso] = useState({
    id_opcion: "",
    puede_ver: false,
    puede_crear: false,
    puede_editar: false,
    puede_eliminar: false,
  });

  const [mostrarModuloNoAsignado, setMostrarModuloNoAsignado] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resRoles, resModulos, resOpciones] = await Promise.all([
          api.get<Rol[]>("/roles"),
          api.get<ModuloBase[]>("/modulos"),
          api.get<Opcion[]>("/opciones"),
        ]);

        setRoles(resRoles.data);

        const modulosConOpciones: ModuloBase[] = resModulos.data.map((modulo) => ({
          ...modulo,
          opciones: resOpciones.data.filter(op => op.id_modulo === modulo.id),
        }));
        setModulosTotales(modulosConOpciones);

      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
        alert("Error al cargar datos iniciales. Revisa la consola.");
      }
    };
    fetchData();
  }, []);

  const cargarPermisosDelRol = async () => {
    if (!rolSeleccionado) {
      setPermisosDelRol([]);
      return;
    }
    try {
      const resTodosPermisos = await api.get<Permiso[]>('/permisos');
      const permisosFiltrados = resTodosPermisos.data.filter(p => p.id_rol === rolSeleccionado);
      setPermisosDelRol(permisosFiltrados);
    } catch (error) {
      console.error("Error cargando permisos:", error);
      setPermisosDelRol([]);
    }
  };

  useEffect(() => {
    cargarPermisosDelRol();
  }, [rolSeleccionado]);

  useEffect(() => {
    if (!rolSeleccionado) {
      setModulosParaMostrar([]);
      return;
    }

    const modulosFiltrados = modulosTotales.reduce<ModuloParaMostrar[]>((acc, modulo) => {
      const opcionesConPermisos = modulo.opciones.reduce<OpcionConPermisos[]>((opcAcc, opcion) => {
        const permiso = permisosDelRol.find(p => p.id_opcion === opcion.id);
        if (permiso) {
          opcAcc.push({
            ...opcion,
            permisoId: permiso.id,
            puede_ver: permiso.puede_ver,
            puede_crear: permiso.puede_crear,
            puede_editar: permiso.puede_editar,
            puede_eliminar: permiso.puede_eliminar,
          });
        }
        return opcAcc;
      }, []);

      if (opcionesConPermisos.length > 0) {
        acc.push({
          ...modulo,
          opciones: opcionesConPermisos,
        });
      }
      return acc;
    }, []);

    setModulosParaMostrar(modulosFiltrados);
  }, [permisosDelRol, modulosTotales, rolSeleccionado]);

  const handleCheckboxChange = (opcionId: number, campo: CampoPermiso, value: boolean) => {
    setPermisosDelRol(prev =>
      prev.map(permiso =>
        permiso.id_opcion === opcionId ? { ...permiso, [campo]: value } : permiso
      )
    );
  };

  const eliminarPermiso = async (permisoId: number) => {
    if (!confirm("¿Seguro que deseas eliminar este permiso? Esto quitará la opción de la lista para este rol.")) return;
    try {
      await api.delete(`/permisos/${permisoId}`);
      alert("Permiso eliminado correctamente.");
      setPermisosDelRol(prev => prev.filter(p => p.id !== permisoId));
    } catch (error) {
      alert("Error al eliminar el permiso.");
      console.error(error);
    }
  };
  
  const crearPermiso = async () => {
    if (!rolSeleccionado || !nuevoPermiso.id_opcion) {
      alert("Debes seleccionar un rol y una opción.");
      return;
    }
    try {
      const { id_opcion, ...restoDePermisos } = nuevoPermiso;
      
      const res = await api.post<Permiso>("/permisos", {
        id_rol: rolSeleccionado,
        id_opcion: Number(id_opcion),
        ...restoDePermisos,
      });

      alert("Permiso creado correctamente.");
      setNuevoPermiso({ id_opcion: "", puede_ver: false, puede_crear: false, puede_editar: false, puede_eliminar: false });
      setMostrarFormularioNuevo(false);
      setPermisosDelRol(prev => [...prev, res.data]);
    } catch (error) {
        const axiosError = error as AxiosError;
        if (axiosError.response?.status === 409) {
            alert("Error: Ya existe un permiso para este rol y opción.");
        } else {
            alert("Error al crear el permiso.");
        }
      console.error(error);
    }
  };

  const guardarPermisos = async () => {
    setGuardando(true);
    try {
      // Creamos un array de promesas, una por cada permiso que se va a actualizar.
      const promesasDeActualizacion = permisosDelRol.map(permiso => {
        const datosDelPermiso = {
          puede_ver: permiso.puede_ver,
          puede_crear: permiso.puede_crear,
          puede_editar: permiso.puede_editar,
          puede_eliminar: permiso.puede_eliminar,
        };
        // Hacemos la llamada a la ruta de actualización individual que SÍ existe
        return api.put(`/permisos/${permiso.id}`, datosDelPermiso);
      });

      // Promise.all ejecuta todas las peticiones y espera a que terminen.
      await Promise.all(promesasDeActualizacion);

      alert("Permisos actualizados correctamente.");
      // Opcional: recargar los datos desde la BD para re-sincronizar
      // await cargarPermisosDelRol(); 
    } catch (error) {
      alert("Ocurrió un error al guardar los cambios.");
      console.error(error);
    } finally {
      setGuardando(false);
    }
  };

  const modulosNoAsignados = modulosTotales.filter(
    (m) => !modulosParaMostrar.some((mm) => mm.id === m.id)
  );

  const renderFormularioNuevo = () => (
    <form onSubmit={(e) => { e.preventDefault(); crearPermiso(); }} className="p-4 border border-gray-300 rounded-md space-y-3 bg-gray-50 my-4">
      <div>
        <label className="block text-sm mb-1 font-medium">Opción:</label>
        <select className="w-full border px-2 py-1 rounded" value={nuevoPermiso.id_opcion} onChange={(e) => setNuevoPermiso({ ...nuevoPermiso, id_opcion: e.target.value })}>
          <option value="">-- Selecciona una opción --</option>
          {modulosTotales.flatMap(modulo =>
            modulo.opciones.map(op => {
              if (permisosDelRol.some(p => p.id_opcion === op.id)) return null;
              return <option key={op.id} value={op.id}>{modulo.nombre_modulo} / {op.nombre_opcion}</option>;
            })
          )}
        </select>
      </div>
      {(["puede_ver", "puede_crear", "puede_editar", "puede_eliminar"] as CampoPermiso[]).map(campo => (
        <label key={campo} className="flex items-center gap-2 capitalize">
          <input type="checkbox" checked={nuevoPermiso[campo]} onChange={(e) => setNuevoPermiso({ ...nuevoPermiso, [campo]: e.target.checked })} />
          <span>{campo.replace("_", " ")}</span>
        </label>
      ))}
      <button type="submit" className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Guardar Permiso</button>
    </form>
  );

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Permisos por Rol</h1>
        
        <div className="max-w-sm space-y-2">
          <label className="block text-sm font-medium text-gray-700">Selecciona un rol:</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-md" onChange={(e) => setRolSeleccionado(e.target.value ? Number(e.target.value) : null)} value={rolSeleccionado ?? ""}>
            <option value="">-- Selecciona --</option>
            {roles.map(rol => <option key={rol.id} value={rol.id}>{rol.nombre_rol}</option>)}
          </select>
        </div>

        {rolSeleccionado && (
          <>
            <div className="flex flex-wrap gap-4 items-center">
              <button onClick={() => setMostrarFormularioNuevo(prev => !prev)} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">{mostrarFormularioNuevo ? "Cancelar" : "Crear Nuevo Permiso"}</button>
              <button onClick={() => setMostrarModuloNoAsignado(m => !m)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">{mostrarModuloNoAsignado ? "Ocultar Módulos no Asignados" : "Ver Módulos no Asignados"}</button>
            </div>

            {mostrarFormularioNuevo && renderFormularioNuevo()}

            {mostrarModuloNoAsignado && (
              <div className="border p-4 mt-4 rounded max-h-80 overflow-auto bg-gray-50">
                <h2 className="font-semibold mb-2 text-gray-700">Módulos sin permisos asignados</h2>
                {modulosNoAsignados.length === 0 ? <p className="text-gray-500">Todos los módulos ya tienen algún permiso.</p> : <ul>{modulosNoAsignados.map(modulo => <li key={modulo.id} className="mb-1">- {modulo.nombre_modulo}</li>)}</ul>}
              </div>
            )}
            
            <div className="space-y-6 mt-4">
              {modulosParaMostrar.length > 0 ? modulosParaMostrar.map(modulo => (
                <div key={modulo.id} className="border border-gray-300 rounded p-4">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b"><span className="font-bold text-lg">{modulo.nombre_modulo}</span></div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left w-2/5">Opción</th>
                          <th className="px-4 py-2 text-center">Ver</th>
                          <th className="px-4 py-2 text-center">Crear</th>
                          <th className="px-4 py-2 text-center">Editar</th>
                          <th className="px-4 py-2 text-center">Eliminar</th>
                          <th className="px-4 py-2 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {modulo.opciones.map(opcion => (
                            <tr key={opcion.id}>
                              <td className="px-4 py-2">
                                <div className="font-semibold">{opcion.nombre_opcion}</div>
                                {opcion.ruta_frontend && <div className="text-xs text-gray-400">{opcion.ruta_frontend}</div>}
                              </td>
                              {(["puede_ver", "puede_crear", "puede_editar", "puede_eliminar"] as CampoPermiso[]).map(campo => (
                                <td key={campo} className="px-4 py-2 text-center">
                                  <input type="checkbox" checked={opcion[campo]} onChange={(e) => handleCheckboxChange(opcion.id, campo, e.target.checked)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
                                </td>
                              ))}
                              <td className="px-4 py-2 text-center">
                                <button className="text-red-600 hover:underline text-xs" onClick={() => eliminarPermiso(opcion.permisoId)}>Eliminar</button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )) : <div className="text-center py-8 px-4 border-2 border-dashed rounded-lg"><p className="text-gray-500">Este rol no tiene permisos asignados.</p><p className="text-gray-400 text-sm mt-2">Usa "Crear Nuevo Permiso" para empezar.</p></div>}
            </div>
            
            {permisosDelRol.length > 0 && (
              <div className="flex justify-end pt-4 border-t mt-6">
                <button onClick={guardarPermisos} disabled={guardando} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow disabled:bg-blue-300 disabled:cursor-not-allowed">{guardando ? "Guardando..." : "Guardar Cambios"}</button>
              </div>
            )}
          </>
        )}
      </div>
    </DefaultLayout>
  );
}