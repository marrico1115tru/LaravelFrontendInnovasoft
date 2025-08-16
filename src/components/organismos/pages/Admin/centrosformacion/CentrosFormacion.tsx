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
  Select,
  SelectItem,
  type SortDescriptor,
  Spinner,
  useDisclosure,
} from "@heroui/react";

import {
  getCentrosFormacion,
  createCentroFormacion,
  updateCentroFormacion,
  deleteCentroFormacion,
} from "@/Api/centrosformacionTable";

import { obtenerMunicipios } from "@/Api/MunicipiosForm";

import api from "@/Api/api";

import DefaultLayout from "@/layouts/default";
import { PlusIcon, MoreVertical, Search as SearchIcon, Pencil, Trash, Lock } from "lucide-react";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const columns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "Nombre", uid: "nombre", sortable: false },
  { name: "Ubicación", uid: "ubicacion", sortable: false },
  { name: "Teléfono", uid: "telefono", sortable: false },
  { name: "Email", uid: "email", sortable: false },
  { name: "Municipio", uid: "municipio", sortable: false },
  { name: "# Sedes", uid: "sedes", sortable: false },
  { name: "Acciones", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "id",
  "nombre",
  "ubicacion",
  "telefono",
  "email",
  "municipio",
  "sedes",
  "actions",
];

// Función para obtener permisos de la API
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

const CentrosFormacionPage = () => {
  const [centros, setCentros] = useState<any[]>([]);
  const [municipios, setMunicipios] = useState<any[]>([]);
  const [filterValue, setFilterValue] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "id",
    direction: "ascending",
  });

  // Campos formulario
  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [idMunicipio, setIdMunicipio] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  // Modal control
  const { isOpen: isModalOpen, onOpen: openModal, onClose: closeModal } = useDisclosure();

  // Estados para permisos y carga
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
    const initializeComponent = async () => {
      try {
        const userCookie = Cookies.get("user");
        if (!userCookie) throw new Error("No se encontró la sesión del usuario. Por favor, inicie sesión nuevamente.");

        const user = JSON.parse(userCookie);
        const idRol = user?.id_rol;
        if (!idRol) throw new Error("El usuario no tiene un rol válido asignado.");

        const rutaActual = "/CentrosFormaciones";

        const fetchedPermisos = await fetchPermisos(rutaActual, idRol);
        setPermisos(fetchedPermisos);

        if (fetchedPermisos.puede_ver) {
          await cargarCentros();
          await cargarMunicipios();
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initializeComponent();
  }, []);

  const cargarCentros = async () => {
    try {
      const data = await getCentrosFormacion();
      setCentros(data);
    } catch (error) {
      console.error("Error cargando centros:", error);
      await MySwal.fire("Error", "Error cargando centros", "error");
    }
  };

  const cargarMunicipios = async () => {
    try {
      const data = await obtenerMunicipios();
      setMunicipios(data);
    } catch (error) {
      console.error("Error cargando municipios:", error);
      await MySwal.fire("Error", "Error cargando municipios", "error");
    }
  };

  const eliminar = async (id: number) => {
    const result = await MySwal.fire({
      title: "¿Eliminar centro?",
      text: "No se podrá recuperar.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteCentroFormacion(id);
      await MySwal.fire("Eliminado", `Centro eliminado: ID ${id}`, "success");
      await cargarCentros();
    } catch (error) {
      console.error("Error eliminando centro:", error);
      await MySwal.fire("Error", "Error eliminando centro", "error");
    }
  };

  const limpiarFormulario = () => {
    setNombre("");
    setUbicacion("");
    setTelefono("");
    setEmail("");
    setIdMunicipio("");
    setEditId(null);
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      await MySwal.fire("Aviso", "El nombre es obligatorio", "info");
      return;
    }
    if (!idMunicipio) {
      await MySwal.fire("Aviso", "Debe seleccionar un municipio", "info");
      return;
    }

    const payload = {
      nombre: nombre.trim(),
      ubicacion: ubicacion.trim(),
      telefono: telefono.trim(),
      email: email.trim(),
      idMunicipio: { id: parseInt(idMunicipio, 10) },
    };

    try {
      if (editId !== null) {
        await updateCentroFormacion(editId, payload);
        await MySwal.fire("Éxito", "Centro actualizado", "success");
      } else {
        await createCentroFormacion(payload);
        await MySwal.fire("Éxito", "Centro creado", "success");
      }
      closeModal();
      limpiarFormulario();
      await cargarCentros();
    } catch (error) {
      console.error("Error guardando centro:", error);
      await MySwal.fire("Error", "Error guardando centro", "error");
    }
  };

  const abrirModalEditar = (centro: any) => {
    setEditId(centro.id);
    setNombre(centro.nombre || "");
    setUbicacion(centro.ubicacion || "");
    setTelefono(centro.telefono || "");
    setEmail(centro.email || "");
    setIdMunicipio(centro.municipio?.id?.toString() || "");
    openModal();
  };

  const filtered = useMemo(() => {
    if (!filterValue) return centros;
    const lowerFilter = filterValue.toLowerCase();
    return centros.filter(
      (c) =>
        `${c.nombre} ${c.ubicacion} ${c.email} ${c.municipio?.nombre || ""}`
          .toLowerCase()
          .includes(lowerFilter)
    );
  }, [centros, filterValue]);

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
      case "nombre":
        return (
          <span className="font-medium text-gray-800 capitalize break-words max-w-[16rem]">
            {item.nombre}
          </span>
        );
      case "ubicacion":
        return <span className="text-sm text-gray-600">{item.ubicacion}</span>;
      case "telefono":
        return <span className="text-sm text-gray-600">{item.telefono}</span>;
      case "email":
        return <span className="text-sm text-gray-600">{item.email}</span>;
      case "municipio":
        return <span className="text-sm text-gray-600">{item.municipio?.nombre || "—"}</span>;
      case "sedes":
        return <span className="text-sm text-gray-600">{item.sedes?.length || 0}</span>;
      case "actions":
        if (!permisos.puede_editar && !permisos.puede_eliminar) {
          return null;
        }
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]">
                <MoreVertical />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              {(() => {
                const itemsReact = [];
                if (permisos.puede_editar) {
                  itemsReact.push(
                    <DropdownItem onPress={() => abrirModalEditar(item)} key={`editar-${item.id}`} startContent={<Pencil size={16} />}>
                      Editar
                    </DropdownItem>
                  );
                }
                if (permisos.puede_eliminar) {
                  itemsReact.push(
                    <DropdownItem onPress={() => eliminar(item.id)} key={`eliminar-${item.id}`} startContent={<Trash size={16} />} className="text-danger">
                      Eliminar
                    </DropdownItem>
                  );
                }
                return itemsReact;
              })()}
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return item[columnKey as keyof typeof item] ?? "—";
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

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">🏫 Gestión de Centros de Formación</h1>
          <p className="text-sm text-gray-600">Consulta y administra los centros disponibles.</p>
        </header>

        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de centros"
            isHeaderSticky
            topContent={
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                  <Input
                    isClearable
                    className="w-full md:max-w-[44%]"
                    radius="lg"
                    placeholder="Buscar por nombre, ubicación o municipio"
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
                            <DropdownItem key={col.uid}>
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
                          limpiarFormulario();
                          openModal();
                        }}
                      >
                        Nuevo Centro
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-default-400 text-sm">Total {centros.length} centros</span>
                  <label className="flex items-center text-default-400 text-sm">
                    Filas por página:&nbsp;
                    <select
                      className="bg-transparent outline-none text-default-600 ml-1"
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
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
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            classNames={{
              th: "py-3 px-4 bg-[#e8ecf4] text-[#0D1324] font-semibold text-sm",
              td: "align-middle py-3 px-4",
            }}
          >
            <TableHeader columns={columns.filter((c) => visibleColumns.has(c.uid))}>
              {(col) => (
                <TableColumn
                  key={col.uid}
                  align={col.uid === "actions" ? "center" : "start"}
                  width={col.uid === "nombre" ? 260 : undefined}
                >
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={sorted} emptyContent="No se encontraron centros">
              {(item) => (
                <TableRow key={item.id}>
                  {(col) => <TableCell>{renderCell(item, col as string)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Modal
          isOpen={isModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              closeModal();
              limpiarFormulario();
            }
          }}
          placement="center"
          className="backdrop-blur-sm bg-black/30"
          isDismissable={false}
        >
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl max-w-lg w-full p-6">
            {() => (
              <>
                <ModalHeader>{editId ? "Editar Centro" : "Nuevo Centro"}</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input
                    label="Nombre"
                    placeholder="Nombre del centro"
                    value={nombre}
                    onValueChange={setNombre}
                    radius="sm"
                    autoFocus
                  />
                  <Input
                    label="Ubicación"
                    placeholder="Dirección o ubicación"
                    value={ubicacion}
                    onValueChange={setUbicacion}
                    radius="sm"
                  />
                  <Input
                    label="Teléfono"
                    placeholder="Teléfono de contacto"
                    value={telefono}
                    onValueChange={setTelefono}
                    radius="sm"
                  />
                  <Input
                    label="Email"
                    placeholder="Correo electrónico"
                    value={email}
                    onValueChange={setEmail}
                    radius="sm"
                  />
                  <Select
                    label="Municipio"
                    radius="sm"
                    selectedKeys={idMunicipio ? new Set([idMunicipio]) : new Set()}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0];
                      setIdMunicipio(val ? String(val) : "");
                    }}
                  >
                    {municipios.map((m) => (
                      <SelectItem key={String(m.id)}>{m.nombre}</SelectItem>
                    ))}
                  </Select>
                </ModalBody>
                <ModalFooter className="flex justify-end gap-3">
                  <Button variant="light" onPress={() => {
                    closeModal();
                    limpiarFormulario();
                  }}>
                    Cancelar
                  </Button>
                  <Button variant="flat" onPress={guardar}>
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

export default CentrosFormacionPage;
