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
  useDisclosure,
  type SortDescriptor,
  Spinner,
  Card,
} from "@heroui/react";

import {
  getCategoriasProductos,
  createCategoriaProducto,
  updateCategoriaProducto,
  deleteCategoriaProducto,
} from "@/Api/Categorias";

import DefaultLayout from "@/layouts/default";
import { Plus, MoreVertical, Search, Pencil, Trash, Lock } from "lucide-react";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import api from "@/Api/api";
import { CardContent } from "@/components/ui/card";

const MySwal = withReactContent(Swal);

const columns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "Nombre", uid: "nombre", sortable: false },
  { name: "UNPSC", uid: "unpsc", sortable: false },
  { name: "Productos", uid: "productos", sortable: false },
  { name: "Acciones", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = ["id", "nombre", "unpsc", "productos", "actions"];

type Permisos = {
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
};

const fetchPermisos = async (ruta: string, idRol: number): Promise<Permisos> => {
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

const CategoriasProductosPage = () => {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [filterValue, setFilterValue] = useState("");
  const [visibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "id",
    direction: "ascending",
  });

  const [nombre, setNombre] = useState("");
  const [unpsc, setUnpsc] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure();

  const [permisos, setPermisos] = useState<Permisos>({
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
          throw new Error(
            "No se encontró la sesión del usuario. Por favor, inicie sesión de nuevo."
          );
        const user = JSON.parse(userCookie);
        const idRol = user?.id_rol;
        if (!idRol) throw new Error("El usuario no tiene un rol válido asignado.");

        const rutaActual = "/CategoriasProductosPage";

        const fetchedPermisos = await fetchPermisos(rutaActual, idRol);
        setPermisos(fetchedPermisos);

        if (!fetchedPermisos.puede_ver) {
          setError("No tienes permiso para ver este módulo.");
          setLoading(false);
          return;
        }

        await cargarCategorias();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  const cargarCategorias = async () => {
    try {
      const data = await getCategoriasProductos();
      setCategorias(data);
    } catch (error) {
      console.error("Error al cargar categorías:", error);
      await MySwal.fire("Error", "Error al cargar categorías", "error");
    }
  };

  const eliminar = async (id: number) => {
    if (!permisos.puede_eliminar) {
      await MySwal.fire("Acceso Denegado", "No tienes permiso para eliminar categorías.", "error");
      return;
    }
    const result = await MySwal.fire({
      icon: "warning",
      title: "¿Eliminar categoría?",
      text: "No se podrá recuperar.",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteCategoriaProducto(id);
      await MySwal.fire("Eliminado", `Categoría eliminada: ID ${id}`, "success");
      await cargarCategorias();
    } catch (error) {
      console.error("Error al eliminar categoría:", error);
      await MySwal.fire("Error", "Error al eliminar categoría", "error");
    }
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      await MySwal.fire("Aviso", "El nombre es obligatorio", "info");
      return;
    }
    if (editId && !permisos.puede_editar) {
      await MySwal.fire("Acceso Denegado", "No tienes permiso para editar categorías.", "error");
      return;
    }
    if (!editId && !permisos.puede_crear) {
      await MySwal.fire("Acceso Denegado", "No tienes permiso para crear categorías.", "error");
      return;
    }

    const payload = {
      nombre: nombre.trim(),
      unpsc: unpsc.trim() || undefined,
    };

    try {
      if (editId) {
        await updateCategoriaProducto(editId, payload);
        await MySwal.fire("Éxito", "Categoría actualizada", "success");
      } else {
        await createCategoriaProducto(payload);
        await MySwal.fire("Éxito", "Categoría creada", "success");
      }
      cerrarModal();
      await cargarCategorias();
    } catch (error) {
      console.error("Error al guardar categoría:", error);
      await MySwal.fire("Error", "Error al guardar categoría", "error");
    }
  };

  const abrirModalEditar = (cat: any) => {
    if (!permisos.puede_editar) {
      MySwal.fire("Acceso Denegado", "No tienes permiso para editar categorías.", "error");
      return;
    }
    setEditId(cat.id);
    setNombre(cat.nombre);
    setUnpsc(cat.unpsc || "");
    onOpen();
  };

  const cerrarModal = () => {
    setEditId(null);
    setNombre("");
    setUnpsc("");
    onClose();
  };

  const filtered = useMemo(() => {
    if (!filterValue) return categorias;
    const lowerFilter = filterValue.toLowerCase();
    return categorias.filter(
      (c) =>
        c.nombre.toLowerCase().includes(lowerFilter) ||
        (c.unpsc || "").toLowerCase().includes(lowerFilter)
    );
  }, [categorias, filterValue]);

  const pages = Math.ceil(filtered.length / rowsPerPage) || 1;

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
      return x === y ? 0 : (x > y ? 1 : -1) * (direction === "ascending" ? 1 : -1);
    });
    return items;
  }, [sliced, sortDescriptor]);

  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case "nombre":
        return <span className="font-medium text-gray-800">{item.nombre}</span>;
      case "unpsc":
        return <span className="text-sm text-gray-600">{item.unpsc || "—"}</span>;
      case "productos":
        return <span className="text-sm text-gray-600">{item.productos?.length || 0}</span>;
      case "actions":
        if (!permisos.puede_editar && !permisos.puede_eliminar) return null;

        // Crear arreglo filtrado para evitar que JSX incluya false
        const menuItems = [];
        if (permisos.puede_editar) {
          menuItems.push(
            <DropdownItem
              key={`editar-${item.id}`}
              onPress={() => abrirModalEditar(item)}
              startContent={<Pencil size={16} />}
            >
              Editar
            </DropdownItem>
          );
        }
        if (permisos.puede_eliminar) {
          menuItems.push(
            <DropdownItem
              key={`eliminar-${item.id}`}
              onPress={() => eliminar(item.id)}
              startContent={<Trash size={16} />}
              className="text-danger"
            >
              Eliminar
            </DropdownItem>
          );
        }
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="rounded-full text-[#0D1324]"
              >
                <MoreVertical />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>{menuItems}</DropdownMenu>
          </Dropdown>
        );
      default:
        return item[columnKey as keyof typeof item] || "—";
    }
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
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">
            📦 Gestión de Categorías de Productos
          </h1>
          <p className="text-sm text-gray-600">
            Consulta y administra las categorías disponibles.
          </p>
        </header>

        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de categorías"
            isHeaderSticky
            topContent={
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                  <Input
                    isClearable
                    className="w-full md:max-w-[44%]"
                    radius="lg"
                    placeholder="Buscar por nombre o UNPSC"
                    startContent={<Search className="text-[#0D1324]" />}
                    value={filterValue}
                    onValueChange={setFilterValue}
                    onClear={() => setFilterValue("")}
                  />
                  {permisos.puede_crear && (
                    <Button
                      className="bg-[#0D1324] hover:bg-[#1a2133] text-white font-medium rounded-lg shadow"
                      endContent={<Plus size={18} />}
                      onPress={onOpen}
                    >
                      Nueva Categoría
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-default-400 text-sm">
                    Total {categorias.length} categorías
                  </span>
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
                <Button
                  size="sm"
                  variant="flat"
                  isDisabled={page === 1}
                  onPress={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <Pagination
                  isCompact
                  showControls
                  page={page}
                  total={pages}
                  onChange={setPage}
                />
                <Button
                  size="sm"
                  variant="flat"
                  isDisabled={page === pages}
                  onPress={() => setPage(page + 1)}
                >
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
                  width={col.uid === "nombre" ? 300 : undefined}
                >
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={sorted} emptyContent="No se encontraron categorías">
              {(item) => (
                <TableRow key={item.id}>
                  {(col) => <TableCell>{renderCell(item, col as string)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="grid gap-4 md:hidden">
          {sorted.length === 0 && (
            <p className="text-center text-gray-500">No se encontraron categorías</p>
          )}
          {sorted.map((cat) => (
            <Card key={cat.id} className="shadow-sm">
              <CardContent className="space-y-2 p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg break-words max-w-[14rem]">{cat.nombre}</h3>
                  {(permisos.puede_editar || permisos.puede_eliminar) && (
                    <Dropdown>
                      <DropdownTrigger>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="rounded-full text-[#0D1324]"
                        >
                          <MoreVertical />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        {(function () {
                          const menuItems = [];
                          if (permisos.puede_editar) {
                            menuItems.push(
                              <DropdownItem
                                key={`editar-${cat.id}`}
                                onPress={() => abrirModalEditar(cat)}
                              >
                                Editar
                              </DropdownItem>
                            );
                          }
                          if (permisos.puede_eliminar) {
                            menuItems.push(
                              <DropdownItem
                                key={`eliminar-${cat.id}`}
                                onPress={() => eliminar(cat.id)}
                              >
                                Eliminar
                              </DropdownItem>
                            );
                          }
                          return menuItems;
                        })()}
                      </DropdownMenu>
                    </Dropdown>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">UNPSC:</span> {cat.unpsc || "—"}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Productos:</span> {cat.productos?.length || 0}
                </p>
                <p className="text-xs text-gray-400">ID: {cat.id}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal */}
        <Modal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          placement="center"
          className="backdrop-blur-sm bg-black/30"
          isDismissable
        >
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl max-w-md w-full p-6">
            {() => (
              <>
                <ModalHeader>{editId ? "Editar Categoría" : "Nueva Categoría"}</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input
                    label="Nombre"
                    placeholder="Nombre de la categoría"
                    value={nombre}
                    onValueChange={setNombre}
                    radius="sm"
                    autoFocus
                  />
                  <Input
                    label="UNPSC (opcional)"
                    placeholder="Código UNPSC"
                    value={unpsc}
                    onValueChange={setUnpsc}
                    radius="sm"
                  />
                </ModalBody>
                <ModalFooter className="flex justify-end gap-3">
                  <Button variant="light" onPress={cerrarModal}>
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

export default CategoriasProductosPage;
