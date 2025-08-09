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
  type SortDescriptor,
} from '@heroui/react';
import {
  getSedes,
  createSede,
  updateSede,
  deleteSede,
} from '@/Api/SedesService';
import { getCentrosFormacion } from '@/Api/centrosformacionTable';
import DefaultLayout from '@/layouts/default';
import { PlusIcon, MoreVertical, Search as SearchIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const columns = [
  { name: 'ID', uid: 'id', sortable: true },
  { name: 'Nombre', uid: 'nombre', sortable: false },
  { name: 'Ubicación', uid: 'ubicacion', sortable: false },
  { name: 'Centro de Formación', uid: 'centro', sortable: false },
  { name: 'Teléfono Centro', uid: 'telefonoCentro', sortable: false },
  { name: 'Email Centro', uid: 'emailCentro', sortable: false },
  { name: '# Áreas', uid: 'areas', sortable: false },
  { name: 'Acciones', uid: 'actions' },
];

const INITIAL_VISIBLE_COLUMNS = [
  'id',
  'nombre',
  'ubicacion',
  'centro',
  'telefonoCentro',
  'emailCentro',
  'areas',
  'actions',
];

export default function SedesPage() {
  const [sedes, setSedes] = useState<any[]>([]);
  const [centros, setCentros] = useState<any[]>([]);
  const [filterValue, setFilterValue] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'id',
    direction: 'ascending',
  });

  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  // guardamos el id del centro como string para <select>
  const [idCentro, setIdCentro] = useState<string>('');
  const [editId, setEditId] = useState<number | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [sds, cfs] = await Promise.all([getSedes(), getCentrosFormacion()]);
      setSedes(sds);
      setCentros(cfs);
    } catch (err) {
      console.error('Error cargando sedes y centros', err);
      await MySwal.fire('Error', 'No se pudo cargar las sedes y centros', 'error');
    }
  };

  const eliminar = async (id: number) => {
    const result = await MySwal.fire({
      title: '¿Eliminar sede?',
      text: 'No se podrá recuperar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;

    try {
      await deleteSede(id);
      await MySwal.fire('Eliminada', `Sede eliminada: ID ${id}`, 'success');
      await cargarDatos();
    } catch (error) {
      console.error(error);
      await MySwal.fire('Error', 'No se pudo eliminar la sede', 'error');
    }
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      await MySwal.fire('Error', 'El nombre es obligatorio', 'error');
      return;
    }
    if (!ubicacion.trim()) {
      await MySwal.fire('Error', 'La ubicación es obligatoria', 'error');
      return;
    }
    if (!idCentro) {
      await MySwal.fire('Error', 'Debe seleccionar un centro de formación', 'error');
      return;
    }

    const payload = {
      nombre: nombre.trim(),
      ubicacion: ubicacion.trim(),
      id_centro_formacion: Number(idCentro),
    };

    try {
      if (editId !== null) {
        await updateSede(editId, payload);
        await MySwal.fire('Actualizada', 'Sede actualizada', 'success');
      } else {
        await createSede(payload);
        await MySwal.fire('Creada', 'Sede creada', 'success');
      }
      limpiarForm();
      setIsModalOpen(false);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      await MySwal.fire('Error', 'Error guardando la sede', 'error');
    }
  };

  const abrirModalEditar = (s: any) => {
    setEditId(s.id);
    setNombre(s.nombre || '');
    setUbicacion(s.ubicacion || '');
    setIdCentro(s.centro_formacion?.id?.toString() || '');
    setIsModalOpen(true);
  };

  const limpiarForm = () => {
    setEditId(null);
    setNombre('');
    setUbicacion('');
    setIdCentro('');
  };

  const filtered = useMemo(() => {
    if (!filterValue) return sedes;
    const lowerFilter = filterValue.toLowerCase();
    return sedes.filter((s) =>
      `${s.nombre} ${s.ubicacion} ${s.centro_formacion?.nombre || ''}`.toLowerCase().includes(lowerFilter)
    );
  }, [sedes, filterValue]);

  const pages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const sliced = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const sorted = useMemo(() => {
    const items = [...sliced];
    const { column, direction } = sortDescriptor;
    items.sort((a, b) => {
      // Para columna especial: nombre del centro y teléfono, email
      const x =
        column === 'centro'
          ? a.centro_formacion?.nombre || ''
          : column === 'telefonoCentro'
          ? a.centro_formacion?.telefono || ''
          : column === 'emailCentro'
          ? a.centro_formacion?.email || ''
          : a[column as keyof typeof a];
      const y =
        column === 'centro'
          ? b.centro_formacion?.nombre || ''
          : column === 'telefonoCentro'
          ? b.centro_formacion?.telefono || ''
          : column === 'emailCentro'
          ? b.centro_formacion?.email || ''
          : b[column as keyof typeof b];

      if (x === y) return 0;
      return (x > y ? 1 : -1) * (direction === 'ascending' ? 1 : -1);
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
      case 'ubicacion':
        return <span className="text-sm text-gray-600">{item.ubicacion}</span>;
      case 'centro':
        return (
          <span className="text-sm text-gray-600">{item.centro_formacion?.nombre || '—'}</span>
        );
      case 'telefonoCentro':
        return (
          <span className="text-sm text-gray-600">
            {item.centro_formacion?.telefono || '—'}
          </span>
        );
      case 'emailCentro':
        return (
          <span className="text-sm text-gray-600">
            {item.centro_formacion?.email || '—'}
          </span>
        );
      case 'areas':
        return <span className="text-sm text-gray-600">{item.areas?.length || 0}</span>;
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
          placeholder="Buscar por nombre, ubicación o centro"
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
              limpiarForm();
              setIsModalOpen(true);
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
      <Button
        isDisabled={page === 1}
        size="sm"
        variant="flat"
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
        isDisabled={page === pages}
        size="sm"
        variant="flat"
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
            🏢 Gestión de Sedes
          </h1>
          <p className="text-sm text-gray-600">Consulta y administra las sedes y sus áreas.</p>
        </header>

        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de sedes"
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
            <TableBody items={sorted} emptyContent="No se encontraron sedes">
              {(item) => (
                <TableRow key={item.id}>
                  {(col) => <TableCell>{renderCell(item, String(col))}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Vista responsive móvil */}
        <div className="grid gap-4 md:hidden">
          {sorted.length === 0 ? (
            <p className="text-center text-gray-500">No se encontraron sedes</p>
          ) : (
            sorted.map((s) => (
              <Card key={s.id} className="shadow-sm">
                <CardContent className="space-y-2 p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">{s.nombre}</h3>
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
                          key={`editar-${s.id}`}
                          onPress={() => abrirModalEditar(s)}
                        >
                          Editar
                        </DropdownItem>
                        <DropdownItem key={`eliminar-${s.id}`} onPress={() => eliminar(s.id)}>
                          Eliminar
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Ubicación:</span> {s.ubicacion}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Centro:</span> {s.centro_formacion?.nombre || '—'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Teléfono:</span> {s.centro_formacion?.telefono || '—'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {s.centro_formacion?.email || '—'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Áreas:</span> {s.areas?.length || 0}
                  </p>
                  <p className="text-xs text-gray-400">ID: {s.id}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Modal
          isOpen={isModalOpen}
          onOpenChange={setIsModalOpen}
          placement="center"
          className="backdrop-blur-sm bg-black/30"
        >
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl max-w-lg w-full p-6">
            <>
              <ModalHeader>{editId !== null ? 'Editar Sede' : 'Nueva Sede'}</ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label="Nombre"
                  placeholder="Ej: Sede Principal"
                  value={nombre}
                  onValueChange={setNombre}
                  radius="sm"
                />
                <Input
                  label="Ubicación"
                  placeholder="Dirección física"
                  value={ubicacion}
                  onValueChange={setUbicacion}
                  radius="sm"
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Centro de Formación
                  </label>
                  <select
                    value={idCentro}
                    onChange={(e) => setIdCentro(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione un centro</option>
                    {centros.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </ModalBody>
              <ModalFooter className="flex justify-end gap-3">
                <Button variant="light" onPress={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="flat" onPress={guardar}>
                  {editId !== null ? 'Actualizar' : 'Crear'}
                </Button>
              </ModalFooter>
            </>
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
}
