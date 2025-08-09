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

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const columns = [
  { name: 'ID', uid: 'id', sortable: true },
  { name: 'Nombre', uid: 'nombre', sortable: false },
  { name: 'Acciones', uid: 'actions' },
];

const INITIAL_VISIBLE_COLUMNS = ['id', 'nombre', 'actions'];

export default function TipoSitiosPage() {
  const [tipoSitios, setTipoSitios] = useState<any[]>([]);
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

  // Carga inicial
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const data = await getTiposSitio();
      setTipoSitios(data);
    } catch (err) {
      console.error('Error cargando tipos de sitios:', err);
      await MySwal.fire('Error', 'No se pudo cargar los tipos de sitios', 'error');
    }
  };

  const eliminar = async (id: number) => {
    const confirm = await MySwal.fire({
      title: '¿Eliminar tipo de sitio?',
      text: 'No se podrá recuperar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!confirm.isConfirmed) return;

    try {
      await deleteTipoSitio(id);
      await MySwal.fire('Eliminado', `Tipo de sitio eliminado: ID ${id}`, 'success');
      await cargarDatos();
    } catch (error) {
      console.error(error);
      await MySwal.fire('Error', 'No se pudo eliminar el tipo de sitio', 'error');
    }
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      await MySwal.fire('Error', 'El nombre es obligatorio', 'error');
      return;
    }

    const payload = { nombre: nombre.trim() };

    try {
      if (editId !== null) {
        await updateTipoSitio(editId, payload);
        await MySwal.fire('Actualizado', 'Tipo de sitio actualizado', 'success');
      } else {
        await createTipoSitio(payload);
        await MySwal.fire('Creado', 'Tipo de sitio creado', 'success');
      }
      limpiarForm();
      onClose();
      await cargarDatos();
    } catch (error) {
      console.error(error);
      await MySwal.fire('Error', 'Error guardando el tipo de sitio', 'error');
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
    if (!filterValue) return tipoSitios;
    return tipoSitios.filter((t) =>
      t.nombre.toLowerCase().includes(filterValue.toLowerCase())
    );
  }, [tipoSitios, filterValue]);

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
      if (x === y) return 0;
      return (x > y ? 1 : -1) * (direction === 'ascending' ? 1 : -1);
    });
    return items;
  }, [sliced, sortDescriptor]);

  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case 'nombre':
        return (
          <span className="font-medium text-gray-800 break-words max-w-[18rem]">
            {item.nombre}
          </span>
        );
      case 'actions':
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                className="rounded-full text-[#0D1324]"
                aria-label="Opciones"
              >
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
          placeholder="Buscar por nombre"
          startContent={<SearchIcon className="text-[#0D1324]" />}
          value={filterValue}
          onValueChange={setFilterValue}
          onClear={() => setFilterValue('')}
          aria-label="Buscar tipos de sitios"
        />
        <div className="flex gap-3">
          <Button
            className="bg-[#0D1324] hover:bg-[#1a2133] text-white font-medium rounded-lg shadow"
            endContent={<PlusIcon />}
            onPress={() => {
              limpiarForm();
              onOpen();
            }}
            aria-label="Nuevo tipo de sitio"
          >
            Nuevo Tipo de Sitio
          </Button>
          <Dropdown>
            <DropdownTrigger>
              <Button variant="flat" aria-haspopup="menu">
                Columnas
              </Button>
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
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-default-400 text-sm">Total {tipoSitios.length} tipos de sitios</span>
        <label className="flex items-center text-default-400 text-sm">
          Filas por página:&nbsp;
          <select
            className="bg-transparent outline-none text-default-600 ml-1"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(parseInt(e.target.value));
              setPage(1);
            }}
            aria-label="Filas por página"
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
  );

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">
            🏷️ Gestión de Tipos de Sitios
          </h1>
          <p className="text-sm text-gray-600">
            Consulta y administra los tipos de sitios disponibles.
          </p>
        </header>

        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de tipos de sitios"
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
                  width={col.uid === 'nombre' ? 320 : undefined}
                >
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={sorted} emptyContent="No se encontraron tipos de sitios">
              {(item) => (
                <TableRow key={item.id}>
                  {(col) => <TableCell>{renderCell(item, col as string)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Responsive móvil */}
        <div className="grid gap-4 md:hidden">
          {sorted.length === 0 ? (
            <p className="text-center text-gray-500">No se encontraron tipos de sitios</p>
          ) : (
            sorted.map((t) => (
              <Card key={t.id} className="shadow-sm">
                <CardContent className="space-y-2 p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg break-words max-w-[18rem]">{t.nombre}</h3>
                    <Dropdown>
                      <DropdownTrigger>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          className="rounded-full text-[#0D1324]"
                          aria-label="Opciones"
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
            ))
          )}
        </div>

        <Modal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          placement="center"
          className="backdrop-blur-sm bg-black/30"
          isDismissable={false}
          aria-label="Formulario nuevo/editar tipo de sitio"
        >
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl max-w-md w-full p-6">
            {(onCloseLocal) => (
              <>
                <ModalHeader>{editId !== null ? 'Editar Tipo de Sitio' : 'Nuevo Tipo de Sitio'}</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input
                    label="Nombre"
                    placeholder="Ej: Parque Natural"
                    value={nombre}
                    onValueChange={setNombre}
                    radius="sm"
                    autoFocus
                  />
                </ModalBody>
                <ModalFooter className="flex justify-end gap-3">
                  <Button variant="light" onPress={onCloseLocal}>
                    Cancelar
                  </Button>
                  <Button variant="flat" onPress={guardar}>
                    {editId !== null ? 'Actualizar' : 'Crear'}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
}
