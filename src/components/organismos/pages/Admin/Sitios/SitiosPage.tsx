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
  getSitios,
  createSitio,
  updateSitio,
  deleteSitio,
} from '@/Api/SitioService';
import { getAreas } from '@/Api/AreasService';
import { getTiposSitio } from '@/Api/Tipo_sitios';
import DefaultLayout from '@/layouts/default';
import { PlusIcon, MoreVertical, Search as SearchIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Toast from '@/components/ui/Toast';

const columns = [
  { name: 'ID', uid: 'id', sortable: true },
  { name: 'Nombre', uid: 'nombre', sortable: false },
  { name: 'Ubicación', uid: 'ubicacion', sortable: false },
  { name: 'Estado', uid: 'estado', sortable: false },
  { name: 'Área', uid: 'area', sortable: false },
  { name: 'Tipo', uid: 'tipo', sortable: false },
  { name: '# Inventarios', uid: 'inventarios', sortable: false },
  { name: 'Acciones', uid: 'actions' },
];

const INITIAL_VISIBLE_COLUMNS = [
  'id',
  'nombre',
  'ubicacion',
  'estado',
  'area',
  'tipo',
  'inventarios',
  'actions',
];

const SitiosPage = () => {
  const [sitios, setSitios] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
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
  const [ubicacion, setUbicacion] = useState('');
  const [estado, setEstado] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO');
  // Estado de los selects tipo string porque value de select es string
  const [idArea, setIdArea] = useState<string>('');
  const [idTipo, setIdTipo] = useState<string>('');
  const [editId, setEditId] = useState<number | null>(null);

  const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure();
  const [toastMsg, setToastMsg] = useState('');

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const cargarDatos = async () => {
    try {
      const [s, a, t] = await Promise.all([getSitios(), getAreas(), getTiposSitio()]);
      setSitios(s);
      setAreas(a);
      setTipos(t);
    } catch (err) {
      console.error('Error cargando datos', err);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const guardar = async () => {
    if (!nombre.trim()) {
      notify('El nombre es obligatorio');
      return;
    }
    if (!ubicacion.trim()) {
      notify('La ubicación es obligatoria');
      return;
    }
    if (!idArea) {
      notify('Debe seleccionar un área');
      return;
    }
    if (!idTipo) {
      notify('Debe seleccionar un tipo de sitio');
      return;
    }

    const payload = {
      nombre,
      ubicacion,
      estado,
      idArea: { id: Number(idArea) },
      idTipoSitio: { id: Number(idTipo) },
    };

    try {
      if (editId) {
        await updateSitio(editId, payload);
        notify('✏️ Sitio actualizado');
      } else {
        await createSitio(payload);
        notify('✅ Sitio creado');
      }
      limpiarForm();
      onClose();
      cargarDatos();
    } catch (error) {
      notify('Error guardando sitio');
      console.error(error);
    }
  };

  const abrirModalEditar = (s: any) => {
    setEditId(s.id);
    setNombre(s.nombre || '');
    setUbicacion(s.ubicacion || '');
    setEstado(s.estado === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO');
    // Aquí convertimos a string para el select, incluso si no tiene id, ponemos cadena vacía
    setIdArea(s.idArea?.id?.toString() ?? '');
    setIdTipo(s.idTipoSitio?.id?.toString() ?? '');
    onOpen();
  };

  const eliminar = async (id: number) => {
    if (!window.confirm('¿Eliminar sitio? No se podrá recuperar.')) return;
    await deleteSitio(id);
    notify(`🗑️ Sitio eliminado: ID ${id}`);
    cargarDatos();
  };

  const limpiarForm = () => {
    setEditId(null);
    setNombre('');
    setUbicacion('');
    setEstado('ACTIVO');
    setIdArea('');
    setIdTipo('');
  };

  // Mapeo de sitios para mostrar nombre área y tipo usando arrays locales
  const sitiosMapeados = useMemo(() =>
    sitios.map((sitio) => {
      // Buscar nombreArea
      const areaEncontrada = areas.find((a) => a.id === sitio.idArea?.id);
      // Buscar nombre tipoSitio
      const tipoEncontrado = tipos.find((t) => t.id === sitio.idTipoSitio?.id);
      return {
        ...sitio,
        idArea: { ...sitio.idArea, nombreArea: areaEncontrada?.nombreArea ?? '—' },
        idTipoSitio: { ...sitio.idTipoSitio, nombre: tipoEncontrado?.nombre ?? '—' },
      };
    }),
    [sitios, areas, tipos]
  );

  const filtered = useMemo(() => {
    if (!filterValue) return sitiosMapeados;
    const lowerFilter = filterValue.toLowerCase();
    return sitiosMapeados.filter((s) =>
      `${s.nombre} ${s.ubicacion} ${s.idArea?.nombreArea} ${s.idTipoSitio?.nombre}`
        .toLowerCase()
        .includes(lowerFilter)
    );
  }, [sitiosMapeados, filterValue]);

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
      return (x > y ? 1 : -1) * (sortDescriptor.direction === 'ascending' ? 1 : -1);
    });
    return items;
  }, [sliced, sortDescriptor]);

  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case 'nombre':
        return <span className="font-medium text-gray-800 break-words max-w-[16rem]">{item.nombre}</span>;
      case 'ubicacion':
        return <span className="text-sm text-gray-600">{item.ubicacion}</span>;
      case 'estado':
        return (
          <span className={`text-sm font-medium ${item.estado === 'ACTIVO' ? 'text-green-600' : 'text-red-600'}`}>
            {item.estado}
          </span>
        );
      case 'area':
        return <span className="text-sm text-gray-600">{item.idArea?.nombreArea}</span>;
      case 'tipo':
        return <span className="text-sm text-gray-600">{item.idTipoSitio?.nombre}</span>;
      case 'inventarios':
        return <span className="text-sm text-gray-600">{item.inventarios?.length ?? 0}</span>;
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
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">🏷️ Gestión de Sitios</h1>
          <p className="text-sm text-gray-600">Consulta y administra bodegas, ambientes y otros sitios.</p>
        </header>

        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de sitios"
            isHeaderSticky
            topContent={
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-4">
                <Input
                  isClearable
                  placeholder="Buscar por nombre, ubicación, área o tipo"
                  startContent={<SearchIcon className="text-[#0D1324]" />}
                  className="w-full md:max-w-[44%]"
                  radius="lg"
                  value={filterValue}
                  onValueChange={setFilterValue}
                  onClear={() => setFilterValue('')}
                />
                <div className="flex gap-3">
                  <Dropdown>
                    <DropdownTrigger><Button variant="flat">Columnas</Button></DropdownTrigger>
                    <DropdownMenu aria-label="Seleccionar columnas">
                      {[...visibleColumns].map((col) => (
                        <DropdownItem key={col} className="py-1 px-2">
                          <Checkbox
                            isSelected={visibleColumns.has(col)}
                            size="sm"
                            onValueChange={() => toggleColumn(col)}
                          >
                            {columns.find((c) => c.uid === col)?.name}
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
                    Nuevo Sitio
                  </Button>
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
            classNames={{ th: 'py-3 px-4 bg-[#e8ecf4] text-[#0D1324] font-semibold text-sm', td: 'align-middle py-3 px-4' }}
          >
            <TableHeader columns={columns.filter(c => visibleColumns.has(c.uid))}>
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
            <TableBody items={sorted} emptyContent="No se encontraron sitios">
              {(item) => (
                <TableRow key={item.id}>
                  {(col) => (
                    <TableCell>{renderCell(item, col as string)}</TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-4 md:hidden">
          {sorted.length === 0 && (
            <p className="text-center text-gray-500">
              No se encontraron sitios
            </p>
          )}
          {sorted.map((s) => (
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
                      <DropdownItem
                        key={`eliminar-${s.id}`}
                        onPress={() => eliminar(s.id)}
                      >
                        Eliminar
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Ubicación:</span> {s.ubicacion}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Estado:</span>{' '}
                  <span
                    className={
                      s.estado === 'INACTIVO' ? 'text-red-600' : 'text-green-600'
                    }
                  >
                    {s.estado}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Área:</span> {s.idArea?.nombreArea}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Tipo:</span> {s.idTipoSitio?.nombre}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Inventarios:</span> {s.inventarios?.length ?? 0}
                </p>
                <p className="text-xs text-gray-400">ID: {s.id}</p>
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
                <ModalHeader>{editId ? 'Editar Sitio' : 'Nuevo Sitio'}</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input
                    label="Nombre"
                    placeholder="Ej: Bodega Norte"
                    value={nombre}
                    onValueChange={setNombre}
                    radius="sm"
                  />
                  <Input
                    label="Ubicación"
                    placeholder="Descripción de la ubicación"
                    value={ubicacion}
                    onValueChange={setUbicacion}
                    radius="sm"
                  />
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Estado
                    </label>
                    <select
                      value={estado}
                      onChange={(e) =>
                        setEstado(e.target.value as 'ACTIVO' | 'INACTIVO')
                      }
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Área
                    </label>
                    <select
                      value={idArea}
                      onChange={(e) => setIdArea(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccione un área</option>
                      {areas.map((a) => (
                        <option key={a.id} value={a.id?.toString()}>
                          {a.nombreArea}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                      Tipo de Sitio
                    </label>
                    <select
                      value={idTipo}
                      onChange={(e) => setIdTipo(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccione un tipo</option>
                      {tipos.map((t) => (
                        <option key={t.id} value={t.id?.toString()}>
                          {t.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
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

export default SitiosPage;
