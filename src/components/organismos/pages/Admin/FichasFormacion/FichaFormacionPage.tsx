import { useEffect, useState, useMemo } from "react";
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

import {
  getFichasFormacion,
  createFichaFormacion,
  updateFichaFormacion,
  deleteFichaFormacion,
} from "@/Api/fichasFormacion";

import { getTitulados } from "@/Api/TituladosService";
import { getUsuarios } from "@/Api/Usuariosform";
import DefaultLayout from "@/layouts/default";
import { PlusIcon, MoreVertical, Search as SearchIcon } from "lucide-react";

const columns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "Nombre", uid: "nombre", sortable: true },
  { name: "Titulado", uid: "titulado", sortable: false },
  { name: "Responsable", uid: "responsable", sortable: false },
  { name: "Acciones", uid: "actions" },
];

const INITIAL_VISIBLE_COLUMNS = ["id", "nombre", "titulado", "responsable", "actions"];

const FichasFormacionPage = () => {
  const [fichas, setFichas] = useState<any[]>([]);
  const [titulados, setTitulados] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  const [filterValue, setFilterValue] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: "id", direction: "ascending" });

  const [nombre, setNombre] = useState("");
  const [idTitulado, setIdTitulado] = useState("");
  const [idResponsable, setIdResponsable] = useState("");
  const [editId, setEditId] = useState<number | null>(null);

  const [toastMsg, setToastMsg] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();

  const notify = (m: string) => {
    setToastMsg(m);
    setTimeout(() => setToastMsg(""), 3000);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [fs, ts, us] = await Promise.all([getFichasFormacion(), getTitulados(), getUsuarios()]);
      setFichas(Array.isArray(fs) ? fs : []);
      setTitulados(Array.isArray(ts) ? ts : []);
      setUsuarios(Array.isArray(us) ? us : []);
    } catch (error) {
      console.error("Error cargando fichas o datos relacionados", error);
      notify("Error cargando fichas o datos relacionados");
    }
  };

  const eliminar = async (id: number) => {
    if (!window.confirm("¿Eliminar ficha? No se podrá recuperar.")) return;
    try {
      await deleteFichaFormacion(id);
      notify(`🗑️ Ficha eliminada: ID ${id}`);
      await cargarDatos();
    } catch {
      notify("Error eliminando ficha");
    }
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      notify("El nombre es obligatorio");
      return;
    }
    if (!idTitulado) {
      notify("Debes seleccionar un titulado");
      return;
    }
    const payload = {
      nombre,
      id_titulado: Number(idTitulado),
      id_usuario_responsable: idResponsable ? Number(idResponsable) : null,
    };
    try {
      if (editId !== null) {
        await updateFichaFormacion(editId, payload);
        notify("✏️ Ficha actualizada");
      } else {
        await createFichaFormacion(payload);
        notify("✅ Ficha creada");
      }
      onClose();
      limpiarFormulario();
      await cargarDatos();
    } catch {
      notify("Error guardando ficha");
    }
  };

  const abrirModalEditar = (ficha: any) => {
    setEditId(ficha.id);
    setNombre(ficha.nombre || "");
    setIdTitulado(ficha.id_titulado?.toString() || "");
    setIdResponsable(ficha.id_usuario_responsable?.toString() || "");
    onOpen();
  };

  const limpiarFormulario = () => {
    setEditId(null);
    setNombre("");
    setIdTitulado("");
    setIdResponsable("");
  };

  const filtered = useMemo(() => {
    if (!filterValue.trim()) return fichas;
    return fichas.filter((f) =>
      `${f.nombre} ${f.titulado?.nombre || ""} ${
        f.usuario_responsable ? `${f.usuario_responsable.nombre} ${f.usuario_responsable.apellido || ""}` : ""
      }`.toLowerCase().includes(filterValue.toLowerCase())
    );
  }, [fichas, filterValue]);

  const pages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const sliced = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const sorted = useMemo(() => {
    const items = [...sliced];
    const { column, direction } = sortDescriptor;
    items.sort((a, b) => {
      let x = a[column as keyof typeof a];
      let y = b[column as keyof typeof b];
      if (typeof x === "string") x = x.toLowerCase();
      if (typeof y === "string") y = y.toLowerCase();

      if (x === y) return 0;
      if (x > y) return direction === "ascending" ? 1 : -1;
      return direction === "ascending" ? -1 : 1;
    });
    return items;
  }, [sliced, sortDescriptor]);

  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case "nombre":
        return <span className="font-medium text-gray-800 break-words max-w-[16rem]">{item.nombre}</span>;
      case "titulado":
        return <span className="text-sm text-gray-600">{item.titulado?.nombre || "—"}</span>;
      case "responsable":
        return (
          <span className="text-sm text-gray-600">
            {item.usuario_responsable ? `${item.usuario_responsable.nombre} ${item.usuario_responsable.apellido || ""}` : "—"}
          </span>
        );
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
        return item[columnKey] ?? "—";
    }
  };

  const toggleColumn = (uid: string) => {
    setVisibleColumns((prev) => {
      const copy = new Set(prev);
      if (copy.has(uid)) copy.delete(uid);
      else copy.add(uid);
      return copy;
    });
  };

  return (
    <DefaultLayout>
      {toastMsg && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50">
          {toastMsg}
        </div>
      )}
      <div className="p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">
            🎓 Gestión de Fichas de Formación
          </h1>
          <p className="text-sm text-gray-600">
            Consulta y administra las fichas académicas.
          </p>
        </header>

        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de fichas"
            isHeaderSticky
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            classNames={{ th: "py-3 px-4 bg-[#e8ecf4] text-[#0D1324] font-semibold text-sm", td: "align-middle py-3 px-4" }}
            topContent={
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                  <Input
                    isClearable
                    className="w-full md:max-w-[44%]"
                    radius="lg"
                    placeholder="Buscar por nombre, titulado o responsable"
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
                        {columns.filter((c) => c.uid !== "actions").map((col) => (
                          <DropdownItem key={col.uid} onPress={() => toggleColumn(col.uid)}>
                            <Checkbox isSelected={visibleColumns.has(col.uid)} readOnly size="sm">
                              {col.name}
                            </Checkbox>
                          </DropdownItem>
                        ))}
                      </DropdownMenu>
                    </Dropdown>
                    <Button className="bg-[#0D1324] hover:bg-[#1a2133] text-white font-medium rounded-lg shadow" endContent={<PlusIcon />} onPress={onOpen}>
                      Nueva Ficha
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-default-400 text-sm">
                    Total {fichas.length} fichas
                  </span>
                  <label className="flex items-center text-default-400 text-sm">
                    Filas por página:&nbsp;
                    <select className="bg-transparent outline-none text-default-600 ml-1" value={rowsPerPage} onChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(1); }}>
                      {[5, 10, 15].map((n) => (<option key={n} value={n}>{n}</option>))}
                    </select>
                  </label>
                </div>
              </div>
            }
            bottomContent={
              <div className="py-2 px-2 flex justify-center items-center gap-2">
                <Button size="sm" variant="flat" isDisabled={page === 1} onPress={() => setPage(page - 1)}>Anterior</Button>
                <Pagination isCompact showControls page={page} total={pages} onChange={setPage} />
                <Button size="sm" variant="flat" isDisabled={page === pages} onPress={() => setPage(page + 1)}>Siguiente</Button>
              </div>
            }
          >
            <TableHeader columns={columns.filter(c => visibleColumns.has(c.uid))}>
              {(col) => (
                <TableColumn key={col.uid} align={col.uid === "actions" ? "center" : "start"} width={col.uid === "nombre" ? 300 : undefined} allowsSorting={col.sortable}>
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={sorted} emptyContent="No se encontraron fichas">
              {(item) => (
                <TableRow key={item.id}>
                  {(col) => <TableCell>{renderCell(item, col as string)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Modal isOpen={isOpen} onOpenChange={onClose} placement="center" className="backdrop-blur-sm bg-black/30">
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl">
            <ModalHeader>{editId ? "Editar Ficha" : "Nueva Ficha"}</ModalHeader>
            <ModalBody className="space-y-4">
              <Input label="Nombre" placeholder="Ej: Ficha 2567890 - ADSI" value={nombre} onValueChange={setNombre} radius="sm" autoFocus />
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Titulado</label>
                <select value={idTitulado} onChange={(e) => setIdTitulado(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Seleccione un titulado</option>
                  {titulados.map((t) => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Responsable</label>
                <select value={idResponsable} onChange={(e) => setIdResponsable(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Seleccione un responsable</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>{`${u.nombre} ${u.apellido ?? ""}`}</option>
                  ))}
                </select>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>Cancelar</Button>
              <Button variant="flat" onPress={guardar}>{editId ? "Actualizar" : "Crear"}</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
};

export default FichasFormacionPage;
