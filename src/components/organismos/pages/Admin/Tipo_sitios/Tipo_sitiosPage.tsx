import { useEffect, useMemo, useState } from 'react';
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
  getTiposSitio,
  createTipoSitio,
  updateTipoSitio,
  deleteTipoSitio,
} from '@/Api/Tipo_sitios';
import DefaultLayout from '@/layouts/default';
import { PlusIcon, MoreVertical, Search as SearchIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Toast from '@/components/ui/Toast';

const columns = [
  { name: 'ID', uid: 'id', sortable: true },
  { name: 'Nombre', uid: 'nombre', sortable: false },
  { name: 'Acciones', uid: 'actions' },
];

const INITIAL_VISIBLE_COLUMNS = ['id', 'nombre', 'actions'];

const TipoSitiosPage = () => {
  const [tipos, setTipos] = useState<any[]>([]);
  const [filterValue, setFilterValue] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'id',
    direction: 'ascending',
  });

  const [nombre, setNombre] = useState('');
  const [editId, setEditId] = useState<number | null>(null);

  const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure();
  const [toastMsg, setToastMsg] = useState('');
  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const data = await getTiposSitio();
      setTipos(data);
    } catch (err) {
      console.error('Error cargando tipos de sitio', err);
    }
  };

  const eliminar = async (id: number) => {
    if (!window.confirm('¿Eliminar tipo de sitio? No se podrá recuperar.')) return;
    await deleteTipoSitio(id);
    notify(`🗑️ Tipo eliminado: ID ${id}`);
    cargarDatos();
  };

  const guardar = async () => {
    const payload = { nombre };
    try {
      if (editId) {
        await updateTipoSitio(editId, payload);
        notify('✏️ Tipo actualizado');
      } else {
        await createTipoSitio(payload);
        notify('✅ Tipo creado');
      }
      limpiarForm();
      onClose();
      cargarDatos();
    } catch (error) {
      notify('Error guardando tipo');
      console.error(error);
    }
  };

  const abrirModalEditar = (t: any) => {
    setEditId(t.id);
    setNombre(t.nombre || '');
    onOpen();
  };

  const limpiarForm = () => {
    setEditId(null);
    setNombre('');
  };

  const filtered = useMemo(() => {
    if (!filterValue) return tipos;
    return tipos.filter((t) =>
      `${t.id} ${t.nombre}`.toLowerCase().includes(filterValue.toLowerCase())
    );
  }, [tipos, filterValue]);

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
        return (
          <span className="font-medium text-gray-800 break-words max-w-[16rem]">
            {item.nombre}
          </span>
        );
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

  const topContent = (
    <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-end md:justify-between">
      <Input
        isClearable
        className="w-full md:max-w-[44%]"
        radius="lg"
        placeholder="Buscar por nombre o ID"
        startContent={<SearchIcon className="text-[#0D1324]" />}
        value={filterValue}
        onValueChange={setFilterValue}
        onClear={() => setFilterValue('')}
      />
      <div className="flex gap-3">
        <Button
          className="bg-[#0D1324] hover:bg-[#1a2133] text-white font-medium rounded-lg shadow"
          endContent={<PlusIcon />}
          onPress={() => {
            limpiarForm();
            onOpen();
          }}
        >
          Nuevo Tipo
        </Button>
        <Dropdown>
          <DropdownTrigger>
            <Button variant="flat">Columnas</Button>
          </DropdownTrigger>
          <DropdownMenu aria-label="Seleccionar columnas">
            {[...visibleColumns].map((col) => (
              <DropdownItem key={col} className="py-1 px-2">
                <Checkbox
                  isSelected={visibleColumns.has(col)}
                  onValueChange={() => toggleColumn(col)}
                  size="sm"
                >
                  {columns.find((c) => c.uid === col)?.name}
                </Checkbox>
              </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
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
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">
            🏷️ Gestión de Tipos de Sitio
          </h1>
          <p className="text-sm text-gray-600">
            Consulta y administra los tipos de sitio registrados.
          </p>
        </header>

        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de tipos de sitio"
            isHeaderSticky
            topContent={topContent}
            bottomContent={bottomContent}
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            classNames={{
              th: 'py-3 px-4 bg-[#e8ecf4] text-[#0D1324] font-semibold text-sm',
              td: 'align-middle py-3 px-4',
            }}
          >
            <TableHeader columns={columns.filter((c) => visibleColumns.has(c.uid))}>
              {(col) => (
                <TableColumn
                  key={col.uid}
                  align={col.uid === 'actions' ? 'center' : 'start'}
                  width={col.uid === 'nombre' ? 260 : undefined}
                >
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={sorted} emptyContent="No se encontraron tipos de sitio">
              {(item) => (
                <TableRow key={item.id}>
                  {(col) => <TableCell>{renderCell(item, col as string)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-4 md:hidden">
          {sorted.length === 0 && (
            <p className="text-center text-gray-500">No se encontraron tipos de sitio</p>
          )}
          {sorted.map((t) => (
            <Card key={t.id} className="shadow-sm">
              <CardContent className="space-y-2 p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{t.nombre}</h3>
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
                      <DropdownItem key={`editar-${t.id}`} onPress={() => abrirModalEditar(t)}>
                        Editar
                      </DropdownItem>
                      <DropdownItem key={`eliminar-${t.id}`} onPress={() => eliminar(t.id)}>
                        Eliminar
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
                <p className="text-xs text-gray-400">ID: {t.id}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Modal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          placement="center"
          className="backdrop-blur-sm bg-black/30"
        >
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl">
            {(onCloseLocal) => (
              <>
                <ModalHeader>{editId ? 'Editar Tipo' : 'Nuevo Tipo'}</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input
                    label="Nombre"
                    placeholder="Ej: Bodega Central"
                    value={nombre}
                    onValueChange={setNombre}
                    radius="sm"
                  />
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onCloseLocal}>
                    Cancelar
                  </Button>
                  <Button variant="flat" onPress={guardar}>
                    {editId ? 'Actualizar' : 'Crear'}
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

export default TipoSitiosPage;
