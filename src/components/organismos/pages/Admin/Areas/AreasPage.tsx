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
  useDisclosure,
  type SortDescriptor,
} from "@heroui/react";

import {
  getAreas,
  createArea,
  updateArea,
  deleteArea,
} from "@/Api/AreasService";

import DefaultLayout from "@/layouts/default";
import { PlusIcon, MoreVertical, Search, Pencil, Trash } from "lucide-react";

import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const columns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "Nombre", uid: "nombre_area", sortable: false },
  { name: "Acciones", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = ["id", "nombre_area", "actions"];

const AreasPage = () => {
  const [areas, setAreas] = useState<any[]>([]);
  const [filterValue, setFilterValue] = useState("");
  const [visibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "id",
    direction: "ascending",
  });

  const [nombre, setNombre] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure();

  const cargarAreas = async () => {
    try {
      const data = await getAreas();
      setAreas(data);
    } catch (error) {
      console.error("Error al cargar áreas:", error);
      await MySwal.fire("Error", "Error al cargar áreas", "error");
    }
  };

  useEffect(() => {
    cargarAreas();
  }, []);

  const eliminar = async (id: number) => {
    const result = await MySwal.fire({
      title: "¿Eliminar área?",
      text: "No se podrá recuperar.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteArea(id);
      await MySwal.fire("Eliminado", `Área eliminada: ID ${id}`, "success");
      await cargarAreas();
    } catch (error) {
      console.error("Error al eliminar área:", error);
      await MySwal.fire("Error", "Error al eliminar área", "error");
    }
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      await MySwal.fire("Aviso", "El nombre es obligatorio", "info");
      return;
    }

    const payload = { nombre_area: nombre.trim() };

    try {
      if (editId) {
        await updateArea(editId, payload);
        await MySwal.fire("Éxito", "Área actualizada", "success");
      } else {
        await createArea(payload);
        await MySwal.fire("Éxito", "Área creada", "success");
      }
      cerrarModal();
      await cargarAreas();
    } catch (error) {
      console.error("Error al guardar área:", error);
      await MySwal.fire("Error", "Error al guardar área", "error");
    }
  };

  const abrirModalEditar = (area: any) => {
    setEditId(area.id);
    setNombre(area.nombre_area);
    onOpen();
  };

  const cerrarModal = () => {
    setEditId(null);
    setNombre("");
    onClose();
  };

  const filtered = useMemo(() => {
    return filterValue
      ? areas.filter((a) =>
          (a.nombre_area || "").toLowerCase().includes(filterValue.toLowerCase())
        )
      : areas;
  }, [areas, filterValue]);

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
      case "nombre_area":
        return (
          <span className="font-medium text-gray-800">{item.nombre_area || "—"}</span>
        );
      case "actions":
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
            <DropdownMenu>
              <DropdownItem
                key={`editar-${item.id}`}
                onPress={() => abrirModalEditar(item)}
                startContent={<Pencil size={16} />}
              >
                Editar
              </DropdownItem>
              <DropdownItem
                key={`eliminar-${item.id}`}
                onPress={() => eliminar(item.id)}
                startContent={<Trash size={16} />}
                className="text-danger"
              >
                Eliminar
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return item[columnKey as keyof typeof item] || "—";
    }
  };

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">
            <span>Gestión de Áreas</span>
          </h1>
          <p className="text-sm text-gray-600">Consulta y administra las áreas disponibles.</p>
        </header>

        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de áreas"
            isHeaderSticky
            topContent={
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                  <Input
                    isClearable
                    className="w-full md:max-w-[44%]"
                    radius="lg"
                    placeholder="Buscar por nombre"
                    startContent={<Search className="text-[#0D1324]" />}
                    value={filterValue}
                    onValueChange={setFilterValue}
                    onClear={() => setFilterValue("")}
                  />
                  <Button
                    className="bg-[#0D1324] hover:bg-[#1a2133] text-white font-medium rounded-lg shadow"
                    endContent={<PlusIcon size={18} />}
                    onPress={onOpen}
                  >
                    Nueva Área
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-default-400 text-sm">Total {areas.length} áreas</span>
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
                  width={col.uid === "nombre_area" ? 300 : undefined}
                >
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={sorted} emptyContent="No se encontraron áreas">
              {(item) => (
                <TableRow key={item.id}>
                  {(col) => <TableCell>{renderCell(item, col as string)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Modal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          placement="center"
          className="backdrop-blur-sm bg-black/30"
          isDismissable
        >
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl max-w-lg w-full p-6">
            {() => (
              <>
                <ModalHeader>{editId ? "Editar Área" : "Nueva Área"}</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input
                    label="Nombre"
                    placeholder="Nombre del área"
                    value={nombre}
                    onValueChange={setNombre}
                    radius="sm"
                    autoFocus
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

export default AreasPage;
