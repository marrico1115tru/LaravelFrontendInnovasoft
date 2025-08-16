"use client";

import { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Button,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  DropdownTrigger,
  Pagination,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Checkbox,
  useDisclosure,
  type SortDescriptor,
  Spinner,
  Card,
} from "@heroui/react";
import { PlusIcon, MoreVertical, Search as SearchIcon, Lock } from "lucide-react";
import DefaultLayout from "@/layouts/default";
import {
  getEntregasMaterial,
  createEntregaMaterial,
  updateEntregaMaterial,
  deleteEntregaMaterial,
  EntregaMaterialPayload,
} from "@/Api/entregaMaterial";
import { getFichasFormacion } from "@/Api/fichasFormacion";
import { getSolicitudes } from "@/Api/Solicitudes";
import { getUsuarios } from "@/Api/Usuariosform";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import api from "@/Api/api";
import { CardContent } from "@/components/ui/card";

const MySwal = withReactContent(Swal);

const columns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "Fecha", uid: "fecha", sortable: false },
  { name: "Observaciones", uid: "observaciones", sortable: false },
  { name: "Ficha", uid: "ficha", sortable: false },
  { name: "Solicitud", uid: "solicitud", sortable: false },
  { name: "Responsable", uid: "responsable", sortable: false },
  { name: "Acciones", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "id",
  "fecha",
  "observaciones",
  "ficha",
  "solicitud",
  "responsable",
  "actions",
];

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

const EntregaMaterialPage = () => {
  // Estados de datos
  const [entregas, setEntregas] = useState<any[]>([]);
  const [fichas, setFichas] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [filterValue, setFilterValue] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "id",
    direction: "ascending",
  });

  // Formularios
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [idFicha, setIdFicha] = useState<number | "">("");
  const [idSolicitud, setIdSolicitud] = useState<number | "">("");
  const [idResponsable, setIdResponsable] = useState<number | "">("");
  const [editId, setEditId] = useState<number | null>(null);

  // Modal control
  const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure();

  // Estados permisos y carga
  const [permisos, setPermisos] = useState({
    puede_ver: false,
    puede_crear: false,
    puede_editar: false,
    puede_eliminar: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial permisos y datos
  useEffect(() => {
    const initialize = async () => {
      try {
        const userCookie = Cookies.get("user");
        if (!userCookie) throw new Error("No se encontró la sesión del usuario. Por favor, inicie sesión de nuevo.");

        const user = JSON.parse(userCookie);
        const idRol = user?.id_rol;
        if (!idRol) throw new Error("El usuario no tiene un rol válido asignado.");

        const rutaActual = "/EntregaMaterialPage";
        const fetchedPermisos = await fetchPermisos(rutaActual, idRol);
        setPermisos(fetchedPermisos);

        if (fetchedPermisos.puede_ver) {
          await cargarDatos();
        } else {
          setError("No tienes permiso para ver este módulo.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  // Cargar datos: entregas, fichas, solicitudes, usuarios
  const cargarDatos = async () => {
    try {
      const [ents, fich, sols, usrs] = await Promise.all([
        getEntregasMaterial(),
        getFichasFormacion(),
        getSolicitudes(),
        getUsuarios(),
      ]);
      setEntregas(ents);
      setFichas(fich);
      setSolicitudes(sols);
      setUsuarios(usrs);
    } catch (err) {
      console.error("Error cargando datos", err);
      await MySwal.fire("Error", "Error cargando datos", "error");
    }
  };

  // Eliminar entrega
  const eliminar = async (id: number) => {
    if (!permisos.puede_eliminar) {
      await MySwal.fire("Acceso Denegado", "No tienes permiso para eliminar entregas.", "error");
      return;
    }
    const result = await MySwal.fire({
      title: "¿Eliminar entrega?",
      text: "No se podrá recuperar.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    try {
      await deleteEntregaMaterial(id);
      await MySwal.fire("Eliminado", `Entrega eliminada: ID ${id}`, "success");
      await cargarDatos();
    } catch (e) {
      console.error(e);
      await MySwal.fire("Error", "Error eliminando entrega", "error");
    }
  };

  // Guardar entrega (nuevo o editar)
  const guardar = async () => {
    if (!permisos.puede_crear && !editId) {
      await MySwal.fire("Acceso Denegado", "No tienes permiso para crear entregas.", "error");
      return;
    }
    if (editId && !permisos.puede_editar) {
      await MySwal.fire("Acceso Denegado", "No tienes permiso para editar entregas.", "error");
      return;
    }
    if (!fechaEntrega || !idFicha || !idSolicitud || !idResponsable) {
      await MySwal.fire("Error", "Completa todos los campos obligatorios", "error");
      return;
    }

    const payload: EntregaMaterialPayload = {
      fecha_entrega: fechaEntrega,
      observaciones: observaciones || null,
      id_ficha_formacion: idFicha,
      id_solicitud: idSolicitud,
      id_usuario_responsable: idResponsable,
    };

    try {
      if (editId) {
        await updateEntregaMaterial(editId, payload);
        await MySwal.fire("Éxito", "Entrega actualizada", "success");
      } else {
        await createEntregaMaterial(payload);
        await MySwal.fire("Éxito", "Entrega creada", "success");
      }
      onClose();
      limpiarFormulario();
      await cargarDatos();
    } catch (e) {
      console.error(e);
      await MySwal.fire("Error", "Error guardando entrega", "error");
    }
  };

  // Abrir modal editar
  const abrirModalEditar = (e: any) => {
    if (!permisos.puede_editar) {
      MySwal.fire("Acceso Denegado", "No tienes permiso para editar entregas.", "error");
      return;
    }
    setEditId(e.id);
    setFechaEntrega(e.fecha_entrega || "");
    setObservaciones(e.observaciones || "");
    setIdFicha(e.ficha?.id || e.idFichaFormacion || "");
    setIdSolicitud(e.solicitud?.id || e.idSolicitud || "");
    setIdResponsable(e.responsable?.id || e.idUsuarioResponsable || "");
    onOpen();
  };

  // Limpiar formulario
  const limpiarFormulario = () => {
    setEditId(null);
    setFechaEntrega("");
    setObservaciones("");
    setIdFicha("");
    setIdSolicitud("");
    setIdResponsable("");
  };

  // Filtrar entregas
  const filtered = useMemo(() => {
    if (!filterValue) return entregas;
    const lowerFilter = filterValue.toLowerCase();
    return entregas.filter(
      (e) =>
        `${e.fecha_entrega || ""} ${e.observaciones || ""} ${e.ficha?.nombre || ""} ${
          e.solicitud?.estado_solicitud || e.solicitud?.estadoSolicitud || ""
        } ${e.responsable?.nombre || ""}`
          .toLowerCase()
          .includes(lowerFilter)
    );
  }, [entregas, filterValue]);

  const pages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const sliced = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const sorted = useMemo(() => {
    const items = [...sliced];
    const { column, direction } = sortDescriptor;
    items.sort((a, b) => {
      const x = a[column as keyof typeof a];
      const y = b[column as keyof typeof b];
      if (x === y) return 0;
      return (x > y ? 1 : -1) * (direction === "ascending" ? 1 : -1);
    });
    return items;
  }, [sliced, sortDescriptor]);

  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case "fecha":
        return <span className="text-sm text-gray-800">{item.fecha_entrega || ""}</span>;
      case "observaciones":
        return <span className="text-sm text-gray-600 break-words max-w-[16rem]">{item.observaciones || "—"}</span>;
      case "ficha":
        return <span className="text-sm text-gray-600">{item.ficha?.nombre || "—"}</span>;
      case "solicitud":
        return (
          <span className="text-sm text-gray-600">
            {item.solicitud?.estadoSolicitud || item.solicitud?.estado_solicitud || "—"}
          </span>
        );
      case "responsable":
        return (
          <span className="text-sm text-gray-600">
            {item.responsable ? `${item.responsable.nombre} ${item.responsable.apellido || ""}` : "—"}
          </span>
        );
      case "actions":
        if (!permisos.puede_editar && !permisos.puede_eliminar) return null;
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]">
                <MoreVertical />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              {permisos.puede_editar ? (
                <DropdownItem onPress={() => abrirModalEditar(item)} key={`editar-${item.id}`}>
                  Editar
                </DropdownItem>
              ) : null}
              {permisos.puede_eliminar ? (
                <DropdownItem onPress={() => eliminar(item.id)} key={`eliminar-${item.id}`}>
                  Eliminar
                </DropdownItem>
              ) : null}
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return item[columnKey as keyof typeof item] || "—";
    }
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const copy = new Set(prev);
      copy.has(key) ? copy.delete(key) : copy.add(key);
      return copy;
    });
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center h-full p-6">
          <Spinner label="Cargando..." />
        </div>
      </DefaultLayout>
    );
  }

  if (error || !permisos.puede_ver) {
    return (
      <DefaultLayout>
        <div className="p-6 text-center text-red-600 flex flex-col items-center gap-4">
          <Lock size={48} />
          <h1 className="text-2xl font-bold">Acceso Denegado</h1>
          <p>{error || "No tienes permiso para ver este módulo."}</p>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">📦 Entrega de Material</h1>
          <p className="text-sm text-gray-600">Registra y gestiona las entregas a programas y solicitudes.</p>
        </header>

        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de entregas"
            isHeaderSticky
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            classNames={{
              th: "py-3 px-4 bg-[#e8ecf4] text-[#0D1324] font-semibold text-sm",
              td: "align-middle py-3 px-4",
            }}
            topContent={
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                  <Input
                    isClearable
                    className="w-full md:max-w-[44%]"
                    radius="lg"
                    placeholder="Buscar por ficha, solicitud o responsable"
                    startContent={<SearchIcon className="text-[#0D1324]" />}
                    value={filterValue}
                    onValueChange={setFilterValue}
                    onClear={() => setFilterValue("")}
                  />
                  <div className="flex gap-3">
                    <Dropdown>
                      <DropdownTrigger>
                        <Button variant="flat">Columnas</Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Seleccionar columnas">
                        {columns
                          .filter((c) => c.uid !== "actions")
                          .map((col) => (
                            <DropdownItem key={col.uid} className="py-1 px-2">
                              <Checkbox
                                isSelected={visibleColumns.has(col.uid)}
                                onValueChange={() => toggleColumn(col.uid)}
                                size="sm"
                              >
                                {col.name}
                              </Checkbox>
                            </DropdownItem>
                          ))}
                      </DropdownMenu>
                    </Dropdown>
                    {permisos.puede_crear ? (
                      <Button
                        className="bg-[#0D1324] hover:bg-[#1a2133] text-white font-medium rounded-lg shadow"
                        endContent={<PlusIcon />}
                        onPress={() => {
                          limpiarFormulario();
                          onOpen();
                        }}
                      >
                        Nueva Entrega
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-default-400 text-sm">Total {entregas.length} entregas</span>
                  <label className="flex items-center text-default-400 text-sm">
                    Filas por página:&nbsp;
                    <select
                      className="bg-transparent outline-none text-default-600 ml-1"
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value));
                        setPage(1);
                      }}
                    >
                      {[5, 10, 15].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>
            }
            bottomContent={
              <div className="py-2 px-2 flex justify-center items-center gap-2">
                <Button size="sm" variant="flat" isDisabled={page === 1} onPress={() => setPage(page - 1)}>
                  Anterior
                </Button>
                <Pagination isCompact showControls page={page} total={pages} onChange={setPage} />
                <Button size="sm" variant="flat" isDisabled={page === pages} onPress={() => setPage(page + 1)}>
                  Siguiente
                </Button>
              </div>
            }
          >
            <TableHeader columns={columns.filter((c) => visibleColumns.has(c.uid))}>
              {(col) => (
                <TableColumn key={col.uid} align={col.uid === "actions" ? "center" : "start"} width={col.uid === "observaciones" ? 300 : undefined}>
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={sorted} emptyContent="No se encontraron entregas">
              {(item) => (
                <TableRow key={item.id}>
                  {(col) => <TableCell>{renderCell(item, col as string)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/** Vista móvil */}
        <div className="grid gap-4 md:hidden">
          {sorted.length === 0 && <p className="text-center text-gray-500">No se encontraron entregas</p>}
          {sorted.map((e) => (
            <Card key={e.id} className="shadow-sm">
              <CardContent className="space-y-2 p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">Entrega ID {e.id}</h3>
                  {(permisos.puede_editar || permisos.puede_eliminar) && (
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]">
                          <MoreVertical />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        {permisos.puede_editar ? (
                          <DropdownItem onPress={() => abrirModalEditar(e)} key={`editar-${e.id}`}>
                            Editar
                          </DropdownItem>
                        ) : null}
                        {permisos.puede_eliminar ? (
                          <DropdownItem onPress={() => eliminar(e.id)} key={`eliminar-${e.id}`}>
                            Eliminar
                          </DropdownItem>
                        ) : null}
                      </DropdownMenu>
                    </Dropdown>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Fecha:</span> {e.fecha_entrega || ""}
                </p>
                <p className="text-sm text-gray-600 break-words">
                  <span className="font-medium">Obs:</span> {e.observaciones || "—"}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Ficha:</span> {e.ficha?.nombre || "—"}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Solicitud:</span> {e.solicitud?.estadoSolicitud || e.solicitud?.estado_solicitud || "—"}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Responsable:</span>{" "}
                  {e.responsable ? `${e.responsable.nombre} ${e.responsable.apellido || ""}` : "—"}
                </p>
                <p className="text-xs text-gray-400">ID: {e.id}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal Nuevo / Editar */}
        <Modal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          placement="center"
          className="backdrop-blur-sm bg-black/30"
          isDismissable
        >
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl max-w-md w-full p-6">
            {(onCloseLocal) => (
              <>
                <ModalHeader>{editId ? "Editar Entrega" : "Nueva Entrega"}</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input
                    label="Fecha de entrega (YYYY-MM-DD)"
                    placeholder="2025-06-22"
                    value={fechaEntrega}
                    onValueChange={setFechaEntrega}
                    radius="sm"
                  />
                  <Input
                    label="Observaciones"
                    placeholder="Observaciones (opcional)"
                    value={observaciones}
                    onValueChange={setObservaciones}
                    radius="sm"
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Ficha Formación</label>
                    <select
                      value={idFicha}
                      onChange={(e) => setIdFicha(Number(e.target.value) || "")}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccione una ficha</option>
                      {fichas.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Solicitud</label>
                    <select
                      value={idSolicitud}
                      onChange={(e) => setIdSolicitud(Number(e.target.value) || "")}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccione una solicitud</option>
                      {solicitudes.map((s) => (
                        <option key={s.id} value={s.id}>
                          {`${s.id} - ${s.estadoSolicitud || s.estado_solicitud}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Responsable</label>
                    <select
                      value={idResponsable}
                      onChange={(e) => setIdResponsable(Number(e.target.value) || "")}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccione un responsable</option>
                      {usuarios.map((u) => (
                        <option key={u.id} value={u.id}>
                          {`${u.nombre} ${u.apellido || ""}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </ModalBody>
                <ModalFooter className="flex justify-end gap-3">
                  <Button variant="light" onPress={onCloseLocal}>
                    Cancelar
                  </Button>
                  <Button color="primary" onPress={guardar}>
                    {editId ? "Actualizar" : "Crear"}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
};

export default EntregaMaterialPage;
