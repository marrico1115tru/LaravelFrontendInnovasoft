import { useEffect, useState, useMemo } from 'react';
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
} from '@heroui/react';

import {
  getCategoriasProductos,
  createCategoriaProducto,
  updateCategoriaProducto,
  deleteCategoriaProducto,
} from '@/Api/Categorias';

import DefaultLayout from '@/layouts/default';
import { PlusIcon, MoreVertical, Search as SearchIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Toast = ({ message }: { message: string }) => (
  <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50">
    {message}
  </div>
);

const columns = [
  { name: 'ID', uid: 'id', sortable: true },
  { name: 'Nombre', uid: 'nombre', sortable: false },
  { name: 'UNPSC', uid: 'unpsc', sortable: false },
  { name: 'Acciones', uid: 'actions' },
];

const INITIAL_VISIBLE_COLUMNS = ['id', 'nombre', 'unpsc', 'actions'];

const CategoriasProductosPage = () => {
  const [categorias, setCategorias] = useState<any[]>([]);
  const [filterValue, setFilterValue] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'id',
    direction: 'ascending',
  });

  const [nombre, setNombre] = useState('');
  const [unpsc, setUnpsc] = useState('');
  const [editId, setEditId] = useState<number | null>(null);

  const [toastMsg, setToastMsg] = useState('');
  const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure();

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const cargarCategorias = async () => {
    try {
      const data = await getCategoriasProductos();
      setCategorias(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      notify('Error al cargar categorías');
    }
  };

  useEffect(() => {
    cargarCategorias();
  }, []);

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar categoría? No se podrá recuperar.')) return;
    try {
      await deleteCategoriaProducto(id);
      notify(`🗑️ Categoría eliminada: ID ${id}`);
      cargarCategorias();
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      notify('Error al eliminar categoría');
    }
  };

  const guardar = async () => {
    const payload = { nombre, unpsc: unpsc || undefined };
    try {
      if (editId) {
        await updateCategoriaProducto(editId, payload);
        notify('Categoría actualizada');
      } else {
        await createCategoriaProducto(payload);
        notify('Categoría creada');
      }
      cerrarModal();
      cargarCategorias();
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      notify('Error al guardar categoría');
    }
  };

  const abrirModalEditar = (cat: any) => {
    setEditId(cat.id);
    setNombre(cat.nombre);
    setUnpsc(cat.unpsc || '');
    onOpen();
  };

  const cerrarModal = () => {
    setEditId(null);
    setNombre('');
    setUnpsc('');
    onClose();
  };

  const filtered = useMemo(() => {
    return filterValue
      ? categorias.filter(
          (c) =>
            c.nombre.toLowerCase().includes(filterValue.toLowerCase()) ||
            (c.unpsc || '').toLowerCase().includes(filterValue.toLowerCase()),
        )
      : categorias;
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
      return x === y ? 0 : (x > y ? 1 : -1) * (direction === 'ascending' ? 1 : -1);
    });
    return items;
  }, [sliced, sortDescriptor]);

  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case 'nombre':
        return <span className="font-medium text-gray-800">{item.nombre}</span>;
      case 'unpsc':
        return <span className="text-sm text-gray-600">{item.unpsc || '—'}</span>;
      case 'actions':
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]">
                <MoreVertical />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem key={`editar-${item.id}`} onPress={() => abrirModalEditar(item)}>
                Editar
              </DropdownItem>
              <DropdownItem key={`eliminar-${item.id}`} onPress={() => eliminar(item.id)}>
                Eliminar
              </DropdownItem>
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

  return (
    <DefaultLayout>
      {toastMsg && <Toast message={toastMsg} />}

      <div className="p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">
            📦 Gestión de Categorías de Productos
          </h1>
          <p className="text-sm text-gray-600">Consulta y administra las categorías disponibles.</p>
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
                    startContent={<SearchIcon className="text-[#0D1324]" />}
                    value={filterValue}
                    onValueChange={setFilterValue}
                    onClear={() => setFilterValue('')}
                  />
                  <div className="flex gap-3">
                    <Dropdown>
                      <DropdownTrigger>
                        <Button variant="flat">Columnas</Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Seleccionar columnas">
                        {columns
                          .filter((c) => c.uid !== 'actions')
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
                      onPress={onOpen}
                    >
                      Nueva Categoría
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-default-400 text-sm">Total {categorias.length} categorías</span>
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
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            classNames={{
              th: 'py-3 px-4 bg-[#e8ecf4] text-[#0D1324] font-semibold text-sm',
              td: 'align-middle py-3 px-4',
            }}
          >
            <TableHeader columns={columns.filter((c) => visibleColumns.has(c.uid))}>
              {(col) => (
                <TableColumn key={col.uid} align={col.uid === 'actions' ? 'center' : 'start'} width={col.uid === 'nombre' ? 300 : undefined}>
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

        {/* Móvil */}
        <div className="grid gap-4 md:hidden">
          {sorted.length === 0 && <p className="text-center text-gray-500">No se encontraron categorías</p>}
          {sorted.map((cat) => (
            <Card key={cat.id} className="shadow-sm">
              <CardContent className="space-y-2 p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg break-words max-w-[14rem]">{cat.nombre}</h3>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]"><MoreVertical /></Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem key={`editar-${cat.id}`} onPress={() => abrirModalEditar(cat)}>Editar</DropdownItem>
                      <DropdownItem key={`eliminar-${cat.id}`} onPress={() => eliminar(cat.id)}>Eliminar</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
                <p className="text-sm text-gray-600"><span className="font-medium">UNPSC:</span> {cat.unpsc || '—'}</p>
                <p className="text-xs text-gray-400">ID: {cat.id}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal Crear/Editar */}
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" isDismissable>
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl">
            <>
              <ModalHeader>{editId ? 'Editar Categoría' : 'Nueva Categoría'}</ModalHeader>
              <ModalBody className="space-y-4">
                <Input label="Nombre" placeholder="Nombre de la categoría" value={nombre} onValueChange={setNombre} radius="sm" />
                <Input label="UNPSC (opcional)" placeholder="Código UNPSC" value={unpsc} onValueChange={setUnpsc} radius="sm" />
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={cerrarModal}>Cancelar</Button>
                <Button color="primary" onPress={guardar}>{editId ? 'Actualizar' : 'Crear'}</Button>
              </ModalFooter>
            </>
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
};

export default CategoriasProductosPage;
