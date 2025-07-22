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
  Checkbox,
  useDisclosure,
  type SortDescriptor,
} from "@heroui/react";
import { getSedes, createSede, updateSede, deleteSede } from "@/Api/SedesService";
import { getCentrosFormacion } from "@/Api/centrosformacionTable";
import DefaultLayout from "@/layouts/default";
import { PlusIcon, MoreVertical, Search as SearchIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Toast = ({ message }: { message: string }) => (
  <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50">{message}</div>
);

const columns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "Nombre", uid: "nombre", sortable: false },
  { name: "Ubicación", uid: "ubicacion", sortable: false },
  { name: "Centro de Formación", uid: "centro", sortable: false },
  { name: "Acciones", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = ["id", "nombre", "ubicacion", "centro", "actions"];

const SedesPage = () => {
  const [sedes, setSedes] = useState<any[]>([]);
  const [centros, setCentros] = useState<any[]>([]);
  const [filterValue, setFilterValue] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "id",
    direction: "ascending",
  });

  const [nombre, setNombre] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [idCentro, setIdCentro] = useState<number | "">("");
  const [editId, setEditId] = useState<number | null>(null);

  const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure();
  const [toastMsg, setToastMsg] = useState("");
  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [sds, cfs] = await Promise.all([getSedes(), getCentrosFormacion()]);
      setSedes(sds);
      setCentros(cfs);
    } catch (err) {
      console.error("Error cargando sedes", err);
    }
  };

  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar sede? No se podrá recuperar.")) return;
    await deleteSede(id);
    notify(`🗑️ Sede eliminada: ID ${id}`);
    cargarDatos();
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      notify("El nombre es obligatorio");
      return;
    }
    if (!ubicacion.trim()) {
      notify("La ubicación es obligatoria");
      return;
    }
    if (!idCentro) {
      notify("Debe seleccionar un centro de formación");
      return;
    }

    const sedeFormData = {
      nombre,
      ubicacion,
      idCentroFormacion: { id: Number(idCentro) },
    };

    try {
      if (editId !== null) {
        await updateSede(editId, sedeFormData);
        notify("✏️ Sede actualizada");
      } else {
        await createSede(sedeFormData);
        notify("✅ Sede creada");
      }
      limpiarForm();
      onClose();
      cargarDatos();
    } catch (error) {
      notify("Error guardando sede");
      console.error(error);
    }
  };

  const abrirModalEditar = (sede: any) => {
    setEditId(sede.id);
    setNombre(sede.nombre || "");
    setUbicacion(sede.ubicacion || "");
    setIdCentro(
      sede.idCentroFormacion?.id ?? sede.id_centro_formacion ?? sede.centro_formacion?.id ?? ""
    );
    onOpen();
  };

  const limpiarForm = () => {
    setEditId(null);
    setNombre("");
    setUbicacion("");
    setIdCentro("");
  };

  const filtered = useMemo(() => {
    if (!filterValue) return sedes;
    const lowerFilter = filterValue.toLowerCase();
    return sedes.filter((s) =>
      `${s.nombre} ${s.ubicacion} ${s.centro_formacion?.nombre ?? ""}`
        .toLowerCase()
        .includes(lowerFilter)
    );
  }, [sedes, filterValue]);

  const pages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const sliced = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const sorted = useMemo(() => {
    const items = [...sliced];
    items.sort((a, b) => {
      const x = a[sortDescriptor.column as keyof typeof a];
      const y = b[sortDescriptor.column as keyof typeof b];
      if (x === y) return 0;
      return (x > y ? 1 : -1) * (sortDescriptor.direction === "ascending" ? 1 : -1);
    });
    return items;
  }, [sliced, sortDescriptor]);

  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case "nombre":
        return <span className="font-medium text-gray-800 break-words max-w-[16rem]">{item.nombre}</span>;
      case "ubicacion":
        return <span className="text-sm text-gray-600">{item.ubicacion}</span>;
      case "centro":
        return <span className="text-sm text-gray-600">{item.centro_formacion?.nombre ?? item.idCentroFormacion?.nombre ?? "—"}</span>;
      case "actions":
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]">
                <MoreVertical />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem key={`editar-${item.id}`} onPress={() => abrirModalEditar(item)}>Editar</DropdownItem>
              <DropdownItem key={`eliminar-${item.id}`} onPress={() => eliminar(item.id)}>Eliminar</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return item[columnKey as keyof typeof item];
    }
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const copy = new Set(prev);
      copy.has(key) ? copy.delete(key) : copy.add(key);
      return copy;
    });
  };

  const topContent = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <Input
          isClearable
          className="w-full md:max-w-[44%]"
          radius="lg"
          placeholder="Buscar por nombre, ubicación o centro"
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
          <Button
            className="bg-[#0D1324] hover:bg-[#1a2133] text-white font-medium rounded-lg shadow"
            endContent={<PlusIcon />}
            onPress={() => {
              limpiarForm();
              onOpen();
            }}
          >
            Nueva Sede
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-default-400 text-sm">Total {sedes.length} sedes</span>
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
  );

  const bottomContent = (
    <div className="py-2 px-2 flex justify-center items-center gap-2">
      <Button size="sm" variant="flat" isDisabled={page === 1} onPress={() => setPage(page - 1)}>
        Anterior
      </Button>
      <Pagination isCompact showControls page={page} total={pages} onChange={setPage} />
      <Button size="sm" variant="flat" isDisabled={page === pages} onPress={() => setPage(page + 1)}>
        Siguiente
      </Button>
    </div>
  );

  return (
    <DefaultLayout>
      {toastMsg && <Toast message={toastMsg} />}
      <div className="p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">🏢 Gestión de Sedes</h1>
          <p className="text-sm text-gray-600">Consulta y administra las sedes.</p>
        </header>

        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de sedes"
            isHeaderSticky
            topContent={topContent}
            bottomContent={bottomContent}
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            classNames={{ th: "py-3 px-4 bg-[#e8ecf4] text-[#0D1324] font-semibold text-sm", td: "align-middle py-3 px-4" }}
          >
            <TableHeader columns={columns.filter(c => visibleColumns.has(c.uid))}>
              {col => (
                <TableColumn key={col.uid} align={col.uid === "actions" ? "center" : "start"} width={col.uid === "nombre" ? 260 : undefined}>
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={sorted} emptyContent="No se encontraron sedes">
              {item => (
                <TableRow key={item.id}>
                  {col => <TableCell>{renderCell(item, String(col))}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="grid gap-4 md:hidden">
          {sorted.length === 0 && <p className="text-center text-gray-500">No se encontraron sedes</p>}
          {sorted.map(s => (
            <Card key={s.id} className="shadow-sm">
              <CardContent className="space-y-2 p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{s.nombre}</h3>
                  <Dropdown>
                    <DropdownTrigger><Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]"><MoreVertical /></Button></DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem key={`editar-${s.id}`} onPress={() => abrirModalEditar(s)}>Editar</DropdownItem>
                      <DropdownItem key={`eliminar-${s.id}`} onPress={() => eliminar(s.id)}>Eliminar</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
                <p className="text-sm text-gray-600"><span className="font-medium">Ubicación:</span> {s.ubicacion}</p>
                <p className="text-sm text-gray-600"><span className="font-medium">Centro:</span> {s.centro_formacion?.nombre || s.idCentroFormacion?.nombre || "—"}</p>
                <p className="text-xs text-gray-400">ID: {s.id}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal */}
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" className="backdrop-blur-sm bg-black/30">
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl">
            {(onCloseLocal) => (
              <>
                <ModalHeader>{editId ? "Editar Sede" : "Nueva Sede"}</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input label="Nombre" placeholder="Ej: Sede Principal" value={nombre} onValueChange={setNombre} radius="sm" />
                  <Input label="Ubicación" placeholder="Dirección física" value={ubicacion} onValueChange={setUbicacion} radius="sm" />
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Centro de Formación</label>
                    <select value={idCentro} onChange={e => setIdCentro(Number(e.target.value) || "")} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Seleccione un centro</option>
                      {centros.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onCloseLocal}>Cancelar</Button>
                  <Button variant="flat" onPress={guardar}>{editId ? "Actualizar" : "Crear"}</Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
};

export default SedesPage;
