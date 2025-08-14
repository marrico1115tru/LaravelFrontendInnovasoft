import React, { useEffect, useMemo, useState } from "react";
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
  type SortDescriptor,
} from "@heroui/react";

import {
  getDetallesSolicitud,
  createDetalleSolicitud,
  updateDetalleSolicitud,
  deleteDetalleSolicitud,
} from "@/Api/detalles_solicitud";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import DefaultLayout from "@/layouts/default";
import {
  PlusIcon,
  MoreVertical,
  Search as SearchIcon,
} from "lucide-react";

const MySwal = withReactContent(Swal);

interface FormState {
  id?: number;
  id_solicitud: string;
  id_producto: string;
  cantidad_solicitada: string;
  observaciones?: string;
}

const columns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "Solicitud", uid: "solicitud", sortable: false },
  { name: "Producto", uid: "producto", sortable: false },
  { name: "Cantidad", uid: "cantidad_solicitada", sortable: false },
  { name: "Observaciones", uid: "observaciones", sortable: false },
  { name: "Acciones", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = [
  "id",
  "solicitud",
  "producto",
  "cantidad_solicitada",
  "observaciones",
  "actions",
];

const DetalleSolicitudView: React.FC = () => {
  const [detalles, setDetalles] = useState<any[]>([]);
  const [filterValue, setFilterValue] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "id",
    direction: "ascending",
  });

  const [form, setForm] = useState<FormState>({
    id_solicitud: "",
    id_producto: "",
    cantidad_solicitada: "",
    observaciones: "",
  });

  // Modal control using heroui modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);

  // Load detalles
  const cargarDetalles = async () => {
    try {
      const data = await getDetallesSolicitud();
      setDetalles(data);
    } catch (error) {
      console.error("Error cargando detalles:", error);
      await MySwal.fire("Error", "Error cargando detalles", "error");
    }
  };

  useEffect(() => {
    cargarDetalles();
  }, []);

  // Filtered data based on filterValue by solicitud name, producto name, observaciones
  const filtered = useMemo(() => {
    if (!filterValue) return detalles;
    const lowerFilter = filterValue.toLowerCase();
    return detalles.filter((d) =>
      `${d.solicitud?.nombre || ""} ${d.producto?.nombre || ""} ${d.observaciones || ""}`
        .toLowerCase()
        .includes(lowerFilter)
    );
  }, [detalles, filterValue]);

  // Pagination
  const pages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const sliced = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  // Sorting
  const sorted = useMemo(() => {
    const items = [...sliced];
    const { column, direction } = sortDescriptor;
    items.sort((a, b) => {
      let x = a[column as keyof typeof a];
      let y = b[column as keyof typeof b];
      if (column === "solicitud") {
        x = a.solicitud?.nombre || "";
        y = b.solicitud?.nombre || "";
      }
      if (column === "producto") {
        x = a.producto?.nombre || "";
        y = b.producto?.nombre || "";
      }

      if (x === y) return 0;
      return (x > y ? 1 : -1) * (direction === "ascending" ? 1 : -1);
    });
    return items;
  }, [sliced, sortDescriptor]);

  // Handle form open (new or edit)
  const abrirModalEditar = (d?: any) => {
    if (d) {
      setEditId(d.id);
      setForm({
        id: d.id,
        id_solicitud: d.id_solicitud?.toString() || "",
        id_producto: d.id_producto?.toString() || "",
        cantidad_solicitada: d.cantidad_solicitada?.toString() || "",
        observaciones: d.observaciones || "",
      });
    } else {
      setEditId(null);
      setForm({
        id_solicitud: "",
        id_producto: "",
        cantidad_solicitada: "",
        observaciones: "",
      });
    }
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setEditId(null);
    setForm({
      id_solicitud: "",
      id_producto: "",
      cantidad_solicitada: "",
      observaciones: "",
    });
  };

  const guardar = async () => {
    if (
      !form.id_solicitud.trim() ||
      !form.id_producto.trim() ||
      !form.cantidad_solicitada.trim()
    ) {
      await MySwal.fire("Aviso", "Por favor complete todos los campos requeridos", "info");
      return;
    }

    const payload = {
      id_solicitud: Number(form.id_solicitud),
      id_producto: Number(form.id_producto),
      cantidad_solicitada: Number(form.cantidad_solicitada),
      observaciones: form.observaciones,
    };

    try {
      if (editId !== null) {
        await updateDetalleSolicitud(editId, payload);
        await MySwal.fire("Éxito", "Detalle actualizado", "success");
      } else {
        await createDetalleSolicitud(payload);
        await MySwal.fire("Éxito", "Detalle creado", "success");
      }
      cerrarModal();
      await cargarDetalles();
    } catch (error) {
      console.error("Error guardando detalle:", error);
      await MySwal.fire("Error", "Error guardando detalle", "error");
    }
  };

  // Eliminar con confirmación
  const eliminar = async (id: number) => {
    const result = await MySwal.fire({
      title: "¿Eliminar detalle?",
      text: "No se podrá recuperar.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteDetalleSolicitud(id);
      await MySwal.fire("Eliminado", `Detalle eliminado ID ${id}`, "success");
      await cargarDetalles();
    } catch (error) {
      console.error("Error eliminando detalle:", error);
      await MySwal.fire("Error", "Error eliminando detalle", "error");
    }
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const copy = new Set(prev);
      copy.has(key) ? copy.delete(key) : copy.add(key);
      return copy;
    });
  };

  // Render cell content
  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case "solicitud":
        return (
          <span className="text-sm text-gray-600">
            {item.solicitud?.nombre || item.id_solicitud}
          </span>
        );
      case "producto":
        return <span className="text-sm text-gray-600">{item.producto?.nombre}</span>;
      case "cantidad_solicitada":
        return <span className="text-sm text-gray-600">{item.cantidad_solicitada}</span>;
      case "observaciones":
        return <span className="text-sm text-gray-600">{item.observaciones || "—"}</span>;
      case "actions":
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]">
                <MoreVertical />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem onPress={() => abrirModalEditar(item)} key={`editar-${item.id}`}>
                Editar
              </DropdownItem>
              <DropdownItem onPress={() => eliminar(item.id)} key={`eliminar-${item.id}`}>
                Eliminar
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return item[columnKey as keyof typeof item];
    }
  };

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">
            📋 Gestión de Detalles de Solicitud
          </h1>
          <p className="text-sm text-gray-600">Consulta y administra los detalles de solicitud.</p>
        </header>

        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de detalles de solicitud"
            isHeaderSticky
            topContent={
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                  <Input
                    isClearable
                    className="w-full md:max-w-[44%]"
                    radius="lg"
                    placeholder="Buscar por solicitud, producto u observaciones"
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
                    <Button
                      className="bg-[#0D1324] hover:bg-[#1a2133] text-white font-medium rounded-lg shadow"
                      endContent={<PlusIcon />}
                      onPress={() => abrirModalEditar()}
                    >
                      Nuevo Detalle
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-default-400 text-sm">Total {detalles.length} detalles</span>
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
                  width={col.uid === "producto" ? 260 : undefined}
                >
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>

            <TableBody items={sorted} emptyContent="No se encontraron detalles">
              {(item) => (
                <TableRow key={item.id}>
                  {(col) => <TableCell>{renderCell(item, col as string)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modal para Crear/Editar Detalle */}
        <Modal
          isOpen={isModalOpen}
          onOpenChange={(open) => {
            if (!open) cerrarModal();
          }}
          placement="center"
          className="backdrop-blur-sm bg-black/30"
          isDismissable={false}
        >
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl max-w-lg w-full p-6">
            {() => (
              <>
                <ModalHeader>{editId ? "Editar Detalle" : "Nuevo Detalle"}</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input
                    label="ID Solicitud"
                    placeholder="ID Solicitud"
                    type="number"
                    radius="sm"
                    value={form.id_solicitud}
                    onValueChange={(val) => setForm((f) => ({ ...f, id_solicitud: val }))}
                    autoFocus
                  />
                  <Input
                    label="ID Producto"
                    placeholder="ID Producto"
                    type="number"
                    radius="sm"
                    value={form.id_producto}
                    onValueChange={(val) => setForm((f) => ({ ...f, id_producto: val }))}
                  />
                  <Input
                    label="Cantidad Solicitada"
                    placeholder="Cantidad Solicitada"
                    type="number"
                    radius="sm"
                    value={form.cantidad_solicitada}
                    onValueChange={(val) => setForm((f) => ({ ...f, cantidad_solicitada: val }))}
                  />
                  <Input
                    label="Observaciones"
                    placeholder="Observaciones"
                    radius="sm"
                    value={form.observaciones}
                    onValueChange={(val) => setForm((f) => ({ ...f, observaciones: val }))}
                  />
                </ModalBody>

                <ModalFooter className="flex justify-end gap-3">
                  <Button variant="light" onPress={cerrarModal}>
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

export default DetalleSolicitudView;
