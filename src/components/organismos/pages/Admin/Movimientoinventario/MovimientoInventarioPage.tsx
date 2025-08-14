import { useEffect, useMemo, useState } from "react";
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
  type SortDescriptor,
  Select,
  SelectItem,
  Checkbox,
} from "@heroui/react";
import { PlusIcon, MoreVertical, Search as SearchIcon } from "lucide-react";
import DefaultLayout from "@/layouts/default";
import * as MovimientoAPI from "@/Api/Movimientosform"; // Importa el servicio corregido
import type { Movimiento, CreateMovimientoData } from "@/types/types/movimientos";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const columns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "Tipo", uid: "tipo_movimiento", sortable: true },
  { name: "Cantidad", uid: "cantidad", sortable: false },
  { name: "ID Entrega", uid: "id_entrega", sortable: false },
  { name: "ID Producto Inv.", uid: "id_producto_inventario", sortable: false },
  { name: "Fecha", uid: "fecha_movimiento", sortable: true },
  { name: "Acciones", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = columns.map((c) => c.uid);

const MovimientosView = () => {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [filterValue, setFilterValue] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "id",
    direction: "ascending",
  });
  const [showModal, setShowModal] = useState(false);
  const [editMovimiento, setEditMovimiento] = useState<Movimiento | null>(null);
  const [formData, setFormData] = useState<CreateMovimientoData>({
    id_entrega: 0,
    tipo_movimiento: "SALIDA",
    cantidad: 1,
    id_producto_inventario: 0,
    fecha_movimiento: new Date().toISOString().split("T")[0],
  });

  const loadMovimientos = async () => {
    try {
      const data = await MovimientoAPI.getMovimientos(); // método corregido
      setMovimientos(data);
    } catch (error) {
      console.error("Error cargando movimientos:", error);
      await MySwal.fire("Error", "Error cargando movimientos", "error");
    }
  };

  useEffect(() => {
    loadMovimientos();
  }, []);

  const eliminar = async (id: number) => {
    const result = await MySwal.fire({
      title: "¿Eliminar movimiento?",
      text: "No se podrá recuperar.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await MovimientoAPI.deleteMovimiento(id);
      await MySwal.fire("Eliminado", `Movimiento eliminado: ID ${id}`, "success");
      await loadMovimientos();
    } catch (error) {
      console.error("Error eliminando movimiento:", error);
      await MySwal.fire("Error", "Error eliminando movimiento", "error");
    }
  };

  const guardar = async () => {
    try {
      if (editMovimiento) {
        await MovimientoAPI.updateMovimiento(editMovimiento.id, formData);
        await MySwal.fire("Éxito", "Movimiento actualizado", "success");
      } else {
        await MovimientoAPI.createMovimiento(formData);
        await MySwal.fire("Éxito", "Movimiento creado", "success");
      }
      setShowModal(false);
      limpiarFormulario();
      await loadMovimientos();
    } catch (error) {
      console.error("Error guardando movimiento:", error);
      await MySwal.fire("Error", "Error guardando movimiento", "error");
    }
  };

  const limpiarFormulario = () => {
    setFormData({
      id_entrega: 0,
      tipo_movimiento: "SALIDA",
      cantidad: 1,
      id_producto_inventario: 0,
      fecha_movimiento: new Date().toISOString().split("T")[0],
    });
    setEditMovimiento(null);
  };

  const abrirModalEditar = (mov: Movimiento) => {
    setEditMovimiento(mov);
    setFormData({
      id_entrega: mov.id_entrega,
      tipo_movimiento: mov.tipo_movimiento,
      cantidad: mov.cantidad,
      id_producto_inventario: mov.id_producto_inventario,
      fecha_movimiento: mov.fecha_movimiento,
    });
    setShowModal(true);
  };

  const filtered = useMemo(() => {
    if (!filterValue.trim()) return movimientos;

    const lower = filterValue.toLowerCase();

    return movimientos.filter(
      (mov) =>
        mov.tipo_movimiento.toLowerCase().includes(lower) ||
        mov.id.toString().includes(lower) ||
        mov.fecha_movimiento.includes(lower)
    );
  }, [movimientos, filterValue]);

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

      if (x === undefined && y === undefined) return 0;
      if (x === undefined) return direction === "ascending" ? -1 : 1;
      if (y === undefined) return direction === "ascending" ? 1 : -1;

      if (column === "fecha_movimiento") {
        const dx = new Date(x as string).getTime();
        const dy = new Date(y as string).getTime();
        return (dx - dy) * (direction === "ascending" ? 1 : -1);
      }

      const sx = x.toString().toLowerCase();
      const sy = y.toString().toLowerCase();

      if (sx === sy) return 0;
      if (sx > sy) return direction === "ascending" ? 1 : -1;
      return direction === "ascending" ? -1 : 1;
    });

    return items;
  }, [sliced, sortDescriptor]);

  const renderCell = (item: Movimiento, columnKey: string) => {
    switch (columnKey) {
      case "tipo_movimiento":
        return (
          <span
            className={`inline-flex items-center justify-center
              text-xs font-medium px-2 py-1 rounded-full border
              ${getTipoMovimientoColor(item.tipo_movimiento)}`}
          >
            {item.tipo_movimiento}
          </span>
        );
      case "fecha_movimiento":
        return new Date(item.fecha_movimiento).toLocaleDateString("es-ES");
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
      default: {
        const value = item[columnKey as keyof typeof item];

        if (typeof value === "string" || typeof value === "number" || value === null || value === undefined) {
          return value ?? "—";
        }

        // En caso de ser objeto que tenga 'id'
        if (value && typeof value === "object" && "id" in value && typeof value.id === "number") {
          return `#${value.id}`;
        }

        return "—";
      }
    }
  };

  const getTipoMovimientoColor = (tipo: string) => {
    switch (tipo.toUpperCase()) {
      case "ENTRADA":
        return "bg-green-100 text-green-800 border border-green-200";
      case "SALIDA":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-blue-100 text-blue-800 border border-blue-200";
    }
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const copy = new Set(prev);
      copy.has(key) ? copy.delete(key) : copy.add(key);
      return copy;
    });
  };

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">
            🗃️ Gestión de Movimientos
          </h1>
          <p className="text-sm text-gray-600">Administra las entradas y salidas de inventario.</p>
        </header>
        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de movimientos"
            isHeaderSticky
            topContent={
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                  <Input
                    isClearable
                    className="w-full md:max-w-[44%]"
                    radius="lg"
                    placeholder="Buscar por tipo, ID o fecha..."
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
                      onPress={() => {
                        limpiarFormulario();
                        setShowModal(true);
                      }}
                    >
                      Nuevo Movimiento
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-default-400 text-sm">Total {movimientos.length} movimientos</span>
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
                  width={col.uid === "tipo_movimiento" ? 140 : undefined}
                >
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={sorted} emptyContent="No se encontraron movimientos">
              {(item) => (
                <TableRow key={item.id}>
                  {(col) => <TableCell>{renderCell(item, col as string)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Modal
          isOpen={showModal}
          onOpenChange={(open) => {
            if (!open) {
              setShowModal(false);
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
                <ModalHeader>{editMovimiento ? "Editar Movimiento" : "Nuevo Movimiento"}</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input
                    label="ID Entrega"
                    type="number"
                    min={1}
                    value={formData.id_entrega.toString()}
                    onValueChange={(val) =>
                      setFormData((fd) => ({ ...fd, id_entrega: val ? Number(val) : 0 }))
                    }
                    radius="sm"
                    required
                  />
                  <Select
                    label="Tipo de Movimiento"
                    radius="sm"
                    selectedKeys={new Set([formData.tipo_movimiento])}
                    onSelectionChange={(keys) => {
                      const val = Array.from(keys)[0];
                      setFormData((fd) => ({ ...fd, tipo_movimiento: (val as string) || "SALIDA" }));
                    }}
                  >
                    {["ENTRADA", "SALIDA"].map((tipo) => (
                      <SelectItem key={tipo}>{tipo}</SelectItem>
                    ))}
                  </Select>
                  <Input
                    label="Cantidad"
                    type="number"
                    min={1}
                    value={formData.cantidad.toString()}
                    onValueChange={(val) =>
                      setFormData((fd) => ({ ...fd, cantidad: val ? Number(val) : 1 }))
                    }
                    radius="sm"
                    required
                  />
                  <Input
                    label="ID Producto Inventario"
                    type="number"
                    min={1}
                    value={formData.id_producto_inventario.toString()}
                    onValueChange={(val) =>
                      setFormData((fd) => ({ ...fd, id_producto_inventario: val ? Number(val) : 0 }))
                    }
                    radius="sm"
                    required
                  />
                  <Input
                    label="Fecha de Movimiento"
                    type="date"
                    value={formData.fecha_movimiento}
                    onValueChange={(val) => setFormData((fd) => ({ ...fd, fecha_movimiento: val || "" }))}
                    radius="sm"
                    required
                  />
                </ModalBody>
                <ModalFooter className="flex justify-end gap-3">
                  <Button variant="light" onPress={() => setShowModal(false)}>
                    Cancelar
                  </Button>
                  <Button variant="flat" onPress={guardar}>
                    {editMovimiento ? "Actualizar" : "Crear"}
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

export default MovimientosView;
