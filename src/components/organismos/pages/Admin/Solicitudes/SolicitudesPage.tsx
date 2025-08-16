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
} from "@heroui/react";

import {
  getSolicitudes,
  createSolicitud,
  updateSolicitud,
  deleteSolicitud,
} from "@/Api/Solicitudes";

import { getUsuarios } from "@/Api/Usuariosform";

import DefaultLayout from "@/layouts/default";

import { PlusIcon, MoreVertical, Search as SearchIcon, Lock, Pencil, Trash } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import type { Solicitud, SolicitudPayload, Usuario } from "@/types/types/Solicitud";
import api from "@/Api/api";

const MySwal = withReactContent(Swal);

const columns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "Fecha", uid: "fecha", sortable: true },
  { name: "Estado", uid: "estado", sortable: false },
  { name: "Solicitante", uid: "solicitante", sortable: false },
  { name: "Acciones", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = ["id", "fecha", "estado", "solicitante", "actions"];

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

export default function SolicitudesPage() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filterValue, setFilterValue] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(new Set<string>(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "id",
    direction: "ascending",
  });

  // Form states
  const [fechaSolicitud, setFechaSolicitud] = useState<string>("");
  const [estado, setEstado] = useState<"PENDIENTE" | "APROBADA" | "RECHAZADA">("PENDIENTE");
  const [idSolicitante, setIdSolicitante] = useState<number | "">("");
  const [editId, setEditId] = useState<number | null>(null);

  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

  // Permisos y carga
  const [permisos, setPermisos] = useState({
    puede_ver: false,
    puede_crear: false,
    puede_editar: false,
    puede_eliminar: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const userCookie = Cookies.get("user");
        if (!userCookie)
          throw new Error("No se encontró la sesión del usuario, por favor inicia sesión.");

        const user = JSON.parse(userCookie);
        const idRol = user?.id_rol;
        if (!idRol) throw new Error("El usuario no tiene un rol válido asignado.");

        const rutaActual = "/SolicitudesPage";
        const fetchedPermisos = await fetchPermisos(rutaActual, idRol);
        setPermisos(fetchedPermisos);

        if (fetchedPermisos.puede_ver) {
          await cargarDatos();
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  async function cargarDatos() {
    try {
      const [sols, users] = await Promise.all([getSolicitudes(), getUsuarios()]);
      setSolicitudes(sols);
      setUsuarios(users);
    } catch (err) {
      console.error("Error cargando solicitudes", err);
      await MySwal.fire("Error", "Error cargando datos", "error");
    }
  }

  async function eliminar(id: number) {
    if (!permisos.puede_eliminar) return;

    const result = await MySwal.fire({
      title: "¿Eliminar solicitud?",
      text: "No se podrá recuperar.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    try {
      await deleteSolicitud(id);
      await MySwal.fire("Eliminada", `Solicitud eliminada: ID ${id}`, "success");
      await cargarDatos();
    } catch (error) {
      console.error(error);
      await MySwal.fire("Error", "Error eliminando solicitud", "error");
    }
  }

  async function guardar() {
    if (!permisos.puede_crear && !editId) {
      await MySwal.fire("Acceso denegado", "No tienes permiso para crear solicitudes.", "error");
      return;
    }
    if (editId && !permisos.puede_editar) {
      await MySwal.fire("Acceso denegado", "No tienes permiso para editar solicitudes.", "error");
      return;
    }

    if (!fechaSolicitud) {
      await MySwal.fire("Error", "La fecha es obligatoria", "error");
      return;
    }
    if (!estado) {
      await MySwal.fire("Error", "El estado es obligatorio", "error");
      return;
    }
    if (!idSolicitante) {
      await MySwal.fire("Error", "Debe seleccionar un solicitante", "error");
      return;
    }

    const payload: SolicitudPayload = {
      fecha_solicitud: fechaSolicitud,
      estado_solicitud: estado,
      id_usuario_solicitante: idSolicitante,
    };

    try {
      if (editId) {
        await updateSolicitud(editId, payload);
        await MySwal.fire("Actualizado", "Solicitud actualizada", "success");
      } else {
        await createSolicitud(payload);
        await MySwal.fire("Creado", "Solicitud creada", "success");
      }
      limpiarForm();
      onClose();
      await cargarDatos();
    } catch (error) {
      console.error(error);
      await MySwal.fire("Error", "Error guardando solicitud", "error");
    }
  }

  function abrirModalEditar(sol: Solicitud) {
    if (!permisos.puede_editar) {
      MySwal.fire("Acceso denegado", "No tienes permiso para editar solicitudes.", "error");
      return;
    }
    setEditId(sol.id);
    setFechaSolicitud(sol.fecha_solicitud);
    setEstado(sol.estado_solicitud || "PENDIENTE");
    setIdSolicitante(sol.id_usuario_solicitante);
    onOpen();
  }

  function limpiarForm() {
    setEditId(null);
    setFechaSolicitud("");
    setEstado("PENDIENTE");
    setIdSolicitante("");
  }

  const filtered = useMemo(() => {
    const f = filterValue.toLowerCase();
    return solicitudes.filter((s) => {
      const usuario = usuarios.find((u) => u.id === s.id_usuario_solicitante);
      return (
        `${s.id} ${s.fecha_solicitud} ${s.estado_solicitud} ${usuario?.nombre || ""} ${
          usuario?.apellido || ""
        }`
          .toLowerCase()
          .includes(f)
      );
    });
  }, [solicitudes, filterValue, usuarios]);

  const pages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const sliced = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const sorted = useMemo(() => {
    const items = [...sliced];
    const { column, direction } = sortDescriptor;
    items.sort((a, b) => {
      const getVal = (obj: any) => (column === "fecha" ? obj.fecha_solicitud : obj[column]);
      const x = getVal(a);
      const y = getVal(b);
      if (x === y) return 0;
      return (x > y ? 1 : -1) * (direction === "ascending" ? 1 : -1);
    });
    return items;
  }, [sliced, sortDescriptor]);

  const renderCell = (item: Solicitud, columnKey: string) => {
    switch (columnKey) {
      case "fecha":
        return <span className="text-sm text-gray-600">{item.fecha_solicitud}</span>;
      case "estado":
        return (
          <span
            className={`text-sm font-medium ${
              item.estado_solicitud === "RECHAZADA"
                ? "text-red-600"
                : item.estado_solicitud === "APROBADA"
                ? "text-green-600"
                : "text-yellow-600"
            }`}
          >
            {item.estado_solicitud}
          </span>
        );
      case "solicitante": {
        const usuario = usuarios.find((u) => u.id === item.id_usuario_solicitante);
        if (!usuario) return <span className="text-sm text-gray-400">Sin solicitante</span>;
        return (
          <span className="text-sm text-gray-800">
            {usuario.nombre} {usuario.apellido || ""}
          </span>
        );
      }
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
                <DropdownItem key={`editar-${item.id}`} onPress={() => abrirModalEditar(item)} startContent={<Pencil size={16} />}>
                  Editar
                </DropdownItem>
              ) : null}
              {permisos.puede_eliminar ? (
                <DropdownItem key={`eliminar-${item.id}`} onPress={() => eliminar(item.id)} startContent={<Trash size={16} />} className="text-danger">
                  Eliminar
                </DropdownItem>
              ) : null}
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return (item as any)[columnKey];
    }
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const copy = new Set(prev);
      if (copy.has(key)) copy.delete(key);
      else copy.add(key);
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

  const topContent = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <Input
          isClearable
          className="w-full md:max-w-[44%]"
          radius="lg"
          placeholder="Buscar por nombre, estado o fecha"
          startContent={<SearchIcon className="text-[#0D1324]" />}
          value={filterValue}
          onValueChange={setFilterValue}
          onClear={() => setFilterValue("")}
          aria-label="Buscar solicitudes"
        />
        <div className="flex gap-3">
          <Dropdown>
            <DropdownTrigger>
              <Button variant="flat" aria-haspopup="menu">
                Columnas
              </Button>
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

          {permisos.puede_crear && (
            <Button
              className="bg-[#0D1324] hover:bg-[#1a2133] text-white font-medium rounded-lg shadow"
              endContent={<PlusIcon />}
              onPress={() => {
                limpiarForm();
                onOpen();
              }}
              aria-label="Nueva Solicitud"
            >
              Nueva Solicitud
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-default-400 text-sm">Total {solicitudes.length} solicitudes</span>
        <label className="flex items-center text-default-400 text-sm">
          Filas por página:&nbsp;
          <select
            className="bg-transparent outline-none text-default-600 ml-1"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(1);
            }}
            aria-label="Filas por página"
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
  );

  const bottomContent = (
    <div className="py-2 px-2 flex justify-center items-center gap-2">
      <Button size="sm" variant="flat" isDisabled={page === 1} onPress={() => setPage(page - 1)} aria-label="Página anterior">
        Anterior
      </Button>
      <Pagination isCompact showControls page={page} total={pages} onChange={setPage} />
      <Button size="sm" variant="flat" isDisabled={page === pages} onPress={() => setPage(page + 1)} aria-label="Página siguiente">
        Siguiente
      </Button>
    </div>
  );

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">📝 Gestión de Solicitudes</h1>
          <p className="text-sm text-gray-600">Consulta y administra las solicitudes de materiales.</p>
        </header>

        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de solicitudes"
            isHeaderSticky
            topContent={topContent}
            bottomContent={bottomContent}
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            classNames={{
              th: "py-3 px-4 bg-[#e8ecf4] text-[#0D1324] font-semibold text-sm",
              td: "align-middle py-3 px-4",
            }}
          >
            <TableHeader columns={columns.filter((c) => visibleColumns.has(c.uid))}>
              {(col) => (
                <TableColumn key={col.uid} align={col.uid === "actions" ? "center" : "start"} width={col.uid === "solicitante" ? 260 : undefined}>
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={sorted} emptyContent="No se encontraron solicitudes">
              {(item) => (
                <TableRow key={item.id}>{(col) => <TableCell>{renderCell(item, String(col))}</TableCell>}</TableRow>
              )}
            </TableBody>
          </Table>
        </div>


        <div className="grid gap-4 md:hidden">
          {sorted.length === 0 ? (
            <p className="text-center text-gray-500">No se encontraron solicitudes</p>
          ) : (
            sorted.map((s) => (
              <Card key={s.id} className="shadow-sm">
                <CardContent className="space-y-2 p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">ID {s.id}</h3>
                    {(permisos.puede_editar || permisos.puede_eliminar) && (
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]" aria-label="Opciones">
                            <MoreVertical />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                          {permisos.puede_editar ? (
                            <DropdownItem key={`editar-${s.id}`} onPress={() => abrirModalEditar(s)}>
                              Editar
                            </DropdownItem>
                          ) : null}
                          {permisos.puede_eliminar ? (
                            <DropdownItem key={`eliminar-${s.id}`} onPress={() => eliminar(s.id)}>
                              Eliminar
                            </DropdownItem>
                          ) : null}
                        </DropdownMenu>
                      </Dropdown>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Fecha:</span> {s.fecha_solicitud}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Estado:</span>{" "}
                    <span
                      className={
                        s.estado_solicitud === "RECHAZADA"
                          ? "text-red-600"
                          : s.estado_solicitud === "APROBADA"
                          ? "text-green-600"
                          : "text-yellow-600"
                      }
                    >
                      {s.estado_solicitud}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Solicitante:</span>{" "}
                    {(() => {
                      const usuario = usuarios.find((u) => u.id === s.id_usuario_solicitante);
                      return usuario ? `${usuario.nombre} ${usuario.apellido || ""}` : "—";
                    })()}
                  </p>
                  <p className="text-xs text-gray-400">ID: {s.id}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>


        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" className="backdrop-blur-sm bg-black/30" isDismissable={false} aria-label="Formulario nuevo/editar solicitud">
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl max-w-md w-full p-6">
            <>
              <ModalHeader>{editId ? "Editar Solicitud" : "Nueva Solicitud"}</ModalHeader>
              <ModalBody className="space-y-4">
                <Input type="date" label="Fecha" value={fechaSolicitud} onValueChange={setFechaSolicitud} radius="sm" />
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Estado</label>
                  <select className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={estado} onChange={(e) => setEstado(e.target.value as "PENDIENTE" | "APROBADA" | "RECHAZADA")}>
                    <option value="PENDIENTE">PENDIENTE</option>
                    <option value="APROBADA">APROBADA</option>
                    <option value="RECHAZADA">RECHAZADA</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Solicitante</label>
                  <select className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" value={idSolicitante} onChange={(e) => setIdSolicitante(Number(e.target.value) || "")}>
                    <option value="">Seleccione un usuario</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} {u.apellido || ""}
                      </option>
                    ))}
                  </select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button variant="flat" onPress={guardar}>
                  {editId ? "Actualizar" : "Crear"}
                </Button>
              </ModalFooter>
            </>
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
}
