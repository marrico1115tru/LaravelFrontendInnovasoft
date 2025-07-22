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
  Select,
  SelectItem,
  useDisclosure,
  type SortDescriptor,
} from "@heroui/react";
import {
  getProductos,
  createProducto,
  updateProducto,
  deleteProducto,
} from "@/Api/Productosform";
import {
  getCategoriasProductos,
  createCategoriaProducto,
} from "@/Api/Categorias";
import DefaultLayout from "@/layouts/default";
import {
  PlusIcon,
  MoreVertical,
  Search as SearchIcon,
} from "lucide-react";
import type { ProductoFormValues } from "@/types/types/typesProductos";

const Toast = ({ message }: { message: string }) => (
  <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50">{message}</div>
);

const columns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "Nombre", uid: "nombre", sortable: false },
  { name: "Descripción", uid: "descripcion", sortable: false },
  { name: "Categoría", uid: "categoria", sortable: false },
  { name: "Stock", uid: "stock", sortable: false },
  { name: "Vencimiento", uid: "fechaVencimiento", sortable: false },
  { name: "Acciones", uid: "actions" },
] as const;

const INITIAL_VISIBLE_COLUMNS = [
  "id",
  "nombre",
  "descripcion",
  "categoria",
  "stock",
  "fechaVencimiento",
  "actions",
] as const;

type ColumnKey = (typeof columns)[number]["uid"];

const ProductosPage = () => {
  const [productos, setProductos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [filterValue, setFilterValue] = useState("");
  const [visibleColumns, setVisibleColumns] = useState(new Set<string>(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: "id", direction: "ascending" });

  const [form, setForm] = useState<ProductoFormValues>({
    nombre: "",
    descripcion: "",
    tipoMateria: "",
    fechaVencimiento: "",
    idCategoriaId: 0,
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [catForm, setCatForm] = useState({ nombre: "", unpsc: "" });

  const prodDisclosure = useDisclosure();
  const catDisclosure = useDisclosure();

  // Control abierto del Select para evitar cierre de modal padre
  const [selectOpen, setSelectOpen] = useState(false);

  const [toastMsg, setToastMsg] = useState("");
  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3000);
  };

  const cargarDatos = async () => {
    try {
      const [prod, cat] = await Promise.all([getProductos(), getCategoriasProductos()]);
      setProductos(prod);
      setCategorias(cat);
    } catch {
      notify("Error cargando datos");
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const toNullIfEmpty = (v: string): string | null => (v.trim() === "" ? null : v.trim());

  const guardarProducto = async () => {
    if (!form.nombre.trim()) {
      notify("El nombre es obligatorio");
      return;
    }
    if (!form.idCategoriaId) {
      notify("Selecciona una categoría");
      return;
    }
    const payload: ProductoFormValues = {
      nombre: form.nombre.trim(),
      descripcion: toNullIfEmpty(form.descripcion),
      tipoMateria: toNullIfEmpty(form.tipoMateria),
      fechaVencimiento: toNullIfEmpty(form.fechaVencimiento),
      idCategoriaId: form.idCategoriaId,
    };
    try {
      if (editId !== null) {
        await updateProducto(editId, payload);
        notify("Producto actualizado");
      } else {
        await createProducto(payload);
        notify("Producto creado");
      }
      prodDisclosure.onClose();
      setEditId(null);
      setForm({ nombre: "", descripcion: "", tipoMateria: "", fechaVencimiento: "", idCategoriaId: 0 });
      cargarDatos();
    } catch {
      notify("Error guardando producto");
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Eliminar producto?")) return;
    try {
      await deleteProducto(id);
      notify(`Producto eliminado: ID ${id}`);
      cargarDatos();
    } catch {
      notify("Error eliminando producto");
    }
  };

  const abrirNuevo = () => {
    setEditId(null);
    setForm({ nombre: "", descripcion: "", tipoMateria: "", fechaVencimiento: "", idCategoriaId: 0 });
    prodDisclosure.onOpen();
  };

  const abrirEditar = (producto: any) => {
    setEditId(producto.id);
    setForm({
      nombre: producto.nombre ?? "",
      descripcion: producto.descripcion ?? "",
      tipoMateria: producto.tipoMateria ?? "",
      fechaVencimiento: producto.fecha_vencimiento ?? "",
      idCategoriaId: producto.id_categoria || 0,
    });
    prodDisclosure.onOpen();
  };

  const guardarCategoria = async () => {
    if (!catForm.nombre.trim()) {
      notify("El nombre de la categoría es obligatorio");
      return;
    }
    try {
      await createCategoriaProducto({
        nombre: catForm.nombre,
        unpsc: catForm.unpsc || undefined,
      });
      notify("Categoría creada");
      setCatForm({ nombre: "", unpsc: "" });
      catDisclosure.onClose();
      cargarDatos();
    } catch {
      notify("Error creando categoría");
    }
  };

  const filtered = useMemo(() => {
    if (!filterValue) return productos;
    const filtro = filterValue.toLowerCase();
    return productos.filter((p) =>
      `${p.nombre} ${p.descripcion ?? ""} ${p.categoria?.nombre ?? ""}`.toLowerCase().includes(filtro),
    );
  }, [productos, filterValue]);

  const pages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const sliced = useMemo(() => filtered.slice((page - 1) * rowsPerPage, page * rowsPerPage), [filtered, page, rowsPerPage]);

  const sorted = useMemo(() => {
    const list = [...sliced];
    list.sort((a, b) => {
      const aVal = a[sortDescriptor.column as keyof typeof a];
      const bVal = b[sortDescriptor.column as keyof typeof b];
      if (aVal === bVal) return 0;
      return (aVal > bVal ? 1 : -1) * (sortDescriptor.direction === "ascending" ? 1 : -1);
    });
    return list;
  }, [sliced, sortDescriptor]);

  const totalStock = (inventarios?: any[]) => {
    if (!inventarios) return 0;
    return inventarios.reduce((acc, i) => acc + (i.stock ?? 0), 0);
  };

  const renderCell = (item: any, key: ColumnKey) => {
    switch (key) {
      case "descripcion":
        return <span className="text-sm text-gray-600 max-w-[18rem] break-words">{item.descripcion ?? "—"}</span>;
      case "categoria":
        return <span className="text-sm text-gray-600">{item.categoria?.nombre ?? "—"}</span>;
      case "stock":
        return <span className="text-sm text-gray-600">{totalStock(item.inventarios)}</span>;
      case "fechaVencimiento":
        return (
          <span className="text-sm text-gray-600">
            {item.fecha_vencimiento ? new Date(item.fecha_vencimiento).toLocaleDateString() : "—"}
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
              <DropdownItem onPress={() => abrirEditar(item)} key={`editar-${item.id}`}>
                Editar
              </DropdownItem>
              <DropdownItem onPress={() => eliminar(item.id)} key={`eliminar-${item.id}`}>
                Eliminar
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return item[key];
    }
  };

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns((prev) => {
      const copy = new Set(prev);
      if (copy.has(key)) copy.delete(key);
      else copy.add(key);
      return copy;
    });
  };

  // Esta función evita cierre del modal al abrir modal categoría
  const handleAddCategoryButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    catDisclosure.onOpen();
  };

  return (
    <DefaultLayout>
      {toastMsg && <Toast message={toastMsg} />}
      <div className="p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">🛠️ Gestión de Productos</h1>
          <p className="text-sm text-gray-600">Consulta y administra los productos disponibles.</p>
        </header>

        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de productos"
            isHeaderSticky
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            classNames={{ th: "py-3 px-4 bg-[#e8ecf4] text-[#0D1324] font-semibold text-sm", td: "align-middle py-3 px-4" }}
            topContent={
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                  <Input
                    isClearable
                    radius="lg"
                    placeholder="Buscar por nombre, descripción o categoría"
                    startContent={<SearchIcon className="text-[#0D1324]" />}
                    value={filterValue}
                    onValueChange={setFilterValue}
                    onClear={() => setFilterValue("")}
                  />
                  <div className="flex gap-3">
                    <Dropdown>
                      <DropdownTrigger><Button variant="flat">Columnas</Button></DropdownTrigger>
                      <DropdownMenu aria-label="Seleccionar columnas">
                        {columns.filter(c => c.uid !== "actions").map(col => (
                          <DropdownItem key={col.uid}>
                            <Checkbox isSelected={visibleColumns.has(col.uid)} onValueChange={() => toggleColumn(col.uid)} size="sm">{col.name}</Checkbox>
                          </DropdownItem>
                        ))}
                      </DropdownMenu>
                    </Dropdown>
                    <Button className="bg-[#0D1324] hover:bg-[#1a2133] text-white font-medium rounded-lg shadow" endContent={<PlusIcon />} onPress={abrirNuevo}>
                      Nuevo Producto
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-default-400 text-sm">Total {productos.length} productos</span>
                  <label className="flex items-center text-default-400 text-sm">
                    Filas:&nbsp;
                    <select className="bg-transparent outline-none text-default-600 ml-1" value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(1); }}>
                      {[5, 10, 15].map(n => <option key={n} value={n}>{n}</option>)}
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
                <TableColumn key={col.uid} align={col.uid === "actions" ? "center" : "start"} width={col.uid === "descripcion" ? 300 : undefined}>
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={sorted} emptyContent="No se encontraron productos">
              {(item) => (
                <TableRow key={item.id}>
                  {(colKey) => <TableCell>{renderCell(item, colKey as ColumnKey)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Modal isOpen={prodDisclosure.isOpen} onOpenChange={prodDisclosure.onOpenChange} isDismissable placement="center" className="backdrop-blur-sm bg-black/30">
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl">
            <>
              <ModalHeader>{editId ? "Editar Producto" : "Nuevo Producto"}</ModalHeader>
              <ModalBody className="space-y-4">
                <Input label="Nombre" value={form.nombre} onValueChange={v => setForm(p => ({ ...p, nombre: v }))} />
                <Input label="Descripción" value={form.descripcion} onValueChange={v => setForm(p => ({ ...p, descripcion: v }))} />
                <Input type="date" label="Fecha de vencimiento" value={form.fechaVencimiento} onValueChange={v => setForm(p => ({ ...p, fechaVencimiento: v }))} />
                <div className="flex items-end gap-2">
                  <Select label="Categoría" className="flex-1" selectedKeys={form.idCategoriaId ? new Set([form.idCategoriaId.toString()]) : new Set()} onSelectionChange={k => setForm(p => ({ ...p, idCategoriaId: Number(Array.from(k)[0]) }))} isOpen={selectOpen} onOpenChange={setSelectOpen}>
                    {categorias.map(c => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.nombre}
                      </SelectItem>
                    ))}
                  </Select>
                  <Button isIconOnly variant="solid" className="bg-[#0D1324] hover:bg-[#1a2133] text-white" onPress={handleAddCategoryButtonClick}>
                    <PlusIcon size={18} />
                  </Button>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={prodDisclosure.onClose}>Cancelar</Button>
                <Button variant="flat" onPress={guardarProducto}>{editId ? "Actualizar" : "Crear"}</Button>
              </ModalFooter>
            </>
          </ModalContent>
        </Modal>

        <Modal isOpen={catDisclosure.isOpen} onOpenChange={catDisclosure.onOpenChange} isDismissable placement="center" className="backdrop-blur-sm bg-black/30">
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl">
            <>
              <ModalHeader>Nueva Categoría</ModalHeader>
              <ModalBody className="space-y-4">
                <Input label="Nombre" value={catForm.nombre} onValueChange={v => setCatForm(p => ({ ...p, nombre: v }))} />
                <Input label="Código UNPSC (opcional)" value={catForm.unpsc} onValueChange={v => setCatForm(p => ({ ...p, unpsc: v }))} />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={catDisclosure.onClose}>Cancelar</Button>
                <Button variant="flat" onPress={guardarCategoria}>Crear</Button>
              </ModalFooter>
            </>
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
};

export default ProductosPage;
