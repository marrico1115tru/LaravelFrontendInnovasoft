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
  getTitulados,
  createTitulado,
  updateTitulado,
  deleteTitulado,
} from '@/Api/TituladosService';
import DefaultLayout from '@/layouts/default';
import { PlusIcon, MoreVertical, Search as SearchIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const columns = [
  { name: 'ID', uid: 'id', sortable: true },
  { name: 'Nombre', uid: 'nombre', sortable: false },
  { name: 'Fichas', uid: 'fichas', sortable: false },
  { name: 'Acciones', uid: 'actions' },
];

const INITIAL_VISIBLE_COLUMNS = ['id', 'nombre', 'fichas', 'actions'];

export default function TituladosPage() {
  const [titulados, setTitulados] = useState<any[]>([]);
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

  const cargarTitulados = async () => {
    try {
      const data = await getTitulados();
      setTitulados(data);
    } catch (err) {
      console.error('Error cargando titulados', err);
      await MySwal.fire('Error', 'Error cargando titulados', 'error');
    }
  };

  useEffect(() => {
    cargarTitulados();
  }, []);

  const eliminar = async (id: number) => {
    const result = await MySwal.fire({
      title: '¿Eliminar titulado?',
      text: 'No se podrá recuperar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;

    try {
      await deleteTitulado(id);
      await MySwal.fire('Eliminado', `Titulado ID ${id} eliminado`, 'success');
      await cargarTitulados();
    } catch (error) {
      console.error('Error eliminando titulado:', error);
      await MySwal.fire('Error', 'Error eliminando titulado', 'error');
    }
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      await MySwal.fire('Atención', 'El nombre es obligatorio', 'warning');
      return;
    }

    const payload = { nombre: nombre.trim() };

    try {
      if (editId !== null) {
        await updateTitulado(editId, payload);
        await MySwal.fire('Éxito', 'Titulado actualizado', 'success');
      } else {
        await createTitulado(payload);
        await MySwal.fire('Éxito', 'Titulado creado', 'success');
      }
      onClose();
      setNombre('');
      setEditId(null);
      await cargarTitulados();
    } catch (error) {
      console.error('Error guardando titulado:', error);
      await MySwal.fire('Error', 'Error guardando titulado', 'error');
    }
  };

  const abrirModalEditar = (t: any) => {
    setEditId(t.id);
    setNombre(t.nombre);
    onOpen();
  };

  const filtered = useMemo(() =>
    filterValue
      ? titulados.filter((t) =>
          t.nombre.toLowerCase().includes(filterValue.toLowerCase())
        )
      : titulados,
    [titulados, filterValue]
  );

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
      return x === y ? 0 : (x > y ? 1 : -1) * (direction === 'ascending' ? 1 : -1);
    });

    return items;
  }, [sliced, sortDescriptor]);

  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case 'nombre':
        return (
          <span className="font-medium text-gray-800 capitalize break-words max-w-[18rem]">
            {item.nombre}
          </span>
        );
      case 'fichas':
        return (
          <span className="text-sm text-gray-600">{item.fichasFormacions?.length ?? 0}</span>
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
              <DropdownItem onPress={() => abrirModalEditar(item)} key="editar">
                Editar
              </DropdownItem>
              <DropdownItem onPress={() => eliminar(item.id)} key="eliminar">
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
      if (copy.has(key)) copy.delete(key);
      else copy.add(key);
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
          placeholder="Buscar titulado por nombre"
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
            onPress={() => {
              setEditId(null);
              setNombre('');
              onOpen();
            }}
          >
            Nuevo Titulado
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-default-400 text-sm">Total {titulados.length} titulados</span>
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
      <div className="p-6 space-y-6">
        {/* Header */}
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">
            🎓 Gestión de Titulados
          </h1>
          <p className="text-sm text-gray-600">Consulta y administra los programas titulados.</p>
        </header>

        {/* Desktop table */}
        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de titulados"
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
            <TableHeader columns={columns.filter(c => visibleColumns.has(c.uid))}>
              {(col) => (
                <TableColumn 
                  key={col.uid} 
                  align={col.uid === 'actions' ? 'center' : 'start'} 
                  width={col.uid === 'nombre' ? 320 : undefined}
                >
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={sorted} emptyContent="No se encontraron titulados">
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
          {sorted.length === 0 && <p className="text-center text-gray-500">No se encontraron titulados</p>}
          {sorted.map(t => (
            <Card key={t.id} className="shadow-sm">
              <CardContent className="space-y-2 p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg break-words max-w-[14rem]">{t.nombre}</h3>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]">
                        <MoreVertical />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem onPress={() => abrirModalEditar(t)} key="editar">
                        Editar
                      </DropdownItem>
                      <DropdownItem onPress={() => eliminar(t.id)} key="eliminar">
                        Eliminar
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Fichas:</span> {t.fichasFormacions?.length ?? 0}
                </p>
                <p className="text-xs text-gray-400">ID: {t.id}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal */}
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" className="backdrop-blur-sm bg-black/30" isDismissable={false}>
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl max-w-md w-full p-6">
            {(onCloseLocal) => (
              <>
                <ModalHeader>{editId ? 'Editar Titulado' : 'Nuevo Titulado'}</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input
                    label="Nombre"
                    value={nombre}
                    onValueChange={setNombre}
                    radius="sm"
                    autoFocus
                  />
                </ModalBody>
                <ModalFooter className="flex justify-end gap-3">
                  <Button variant="light" onPress={onCloseLocal}>Cancelar</Button>
                  <Button variant="flat" onPress={guardar}>{editId ? 'Actualizar' : 'Crear'}</Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
}
