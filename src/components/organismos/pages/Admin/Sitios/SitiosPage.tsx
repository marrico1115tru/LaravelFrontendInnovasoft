import { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie'; // Para leer cookie usuario
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
  Spinner,
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
import { PlusIcon, MoreVertical, Search as SearchIcon, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import api from '@/Api/api'; // instancia axios

const MySwal = withReactContent(Swal);

// --- CORRECCIÓN: Se elimina la columna '# Inventarios' ---
const columns = [
  { name: 'ID', uid: 'id', sortable: true },
  { name: 'Nombre', uid: 'nombre', sortable: false },
  { name: 'Ubicación', uid: 'ubicacion', sortable: false },
  { name: 'Estado', uid: 'estado', sortable: false },
  { name: 'Área', uid: 'area', sortable: false },
  { name: 'Tipo', uid: 'tipo', sortable: false },
  { name: 'Acciones', uid: 'actions' },
];

// --- CORRECCIÓN: Se quita 'inventarios' de las columnas visibles iniciales ---
const INITIAL_VISIBLE_COLUMNS = [
  'id',
  'nombre',
  'ubicacion',
  'estado',
  'area',
  'tipo',
  'actions',
];

// Función para obtener permisos desde el backend
const fetchPermisos = async (ruta: string, idRol: number) => {
  try {
    const { data } = await api.get('/por-ruta-rol/permisos', {
      params: { ruta, idRol },
    });
    return data.permisos;
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    return {
      puede_ver: false,
      puede_crear: false,
      puede_editar: false,
      puede_eliminar: false,
    };
  }
};

export default function SitiosPage() {
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

  // Form states
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [estado, setEstado] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO');
  const [idArea, setIdArea] = useState<number | ''>('');
  const [idTipo, setIdTipo] = useState<number | ''>('');
  const [editId, setEditId] = useState<number | null>(null);

  const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure();

  // Estados para permisos, carga y error
  const [permisos, setPermisos] = useState({
    puede_ver: false,
    puede_crear: false,
    puede_editar: false,
    puede_eliminar: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial: obtiene permisos y datos si puede ver
  useEffect(() => {
    const initialize = async () => {
      try {
        const userCookie = Cookies.get('user');
        if (!userCookie) throw new Error('No se encontró la sesión del usuario. Por favor, inicie sesión de nuevo.');

        const user = JSON.parse(userCookie);
        const idRol = user?.id_rol;
        if (!idRol) throw new Error('El usuario no tiene un rol válido asignado.');

        const rutaActual = '/SitiosPage';
        const fetchedPermisos = await fetchPermisos(rutaActual, idRol);
        setPermisos(fetchedPermisos);

        if (fetchedPermisos.puede_ver) {
          await cargarDatos();
        } else {
          setError('No tienes permiso para ver este módulo.');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  // Carga datos sitios, áreas y tipos
  const cargarDatos = async () => {
    try {
      const [s, a, t] = await Promise.all([
        getSitios(),
        getAreas(),
        getTiposSitio(),
      ]);
      setSitios(s);
      setAreas(a);
      setTipos(t);
    } catch (err) {
      console.error(err);
      await MySwal.fire('Error', 'Error cargando sitios, áreas o tipos', 'error');
    }
  };

  // Funciones CRUD

  const eliminar = async (id: number) => {
    const result = await MySwal.fire({
      title: '¿Eliminar sitio?',
      text: 'No se podrá recuperar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await deleteSitio(id);
      await MySwal.fire('Eliminado', `Sitio eliminado: ID ${id}`, 'success');
      await cargarDatos();
    } catch (error) {
      console.error(error);
      await MySwal.fire('Error', 'Error eliminando sitio', 'error');
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
    if (!idArea) {
      await MySwal.fire('Error', 'Debe seleccionar un área', 'error');
      return;
    }
    if (!idTipo) {
      await MySwal.fire('Error', 'Debe seleccionar un tipo de sitio', 'error');
      return;
    }
    const payload = {
      nombre: nombre.trim(),
      ubicacion: ubicacion.trim(),
      estado,
      id_area: idArea,
      id_tipo_sitio: idTipo,
    };
    try {
      if (editId !== null) {
        await updateSitio(editId, payload);
        await MySwal.fire('Actualizado', 'Sitio actualizado', 'success');
      } else {
        await createSitio(payload);
        await MySwal.fire('Creado', 'Sitio creado', 'success');
      }
      limpiarForm();
      onClose();
      await cargarDatos();
    } catch (error) {
      console.error(error);
      await MySwal.fire('Error', 'Error guardando sitio', 'error');
    }
  };

  const abrirModalEditar = (s: any) => {
    setEditId(s.id);
    setNombre(s.nombre || '');
    setUbicacion(s.ubicacion || '');
    setEstado(s.estado === 'INACTIVO' ? 'INACTIVO' : 'ACTIVO');
    setIdArea(s.area?.id || s.id_area || '');
    setIdTipo(s.tipo_sitio?.id || s.id_tipo_sitio || '');
    onOpen();
  };

  const limpiarForm = () => {
    setEditId(null);
    setNombre('');
    setUbicacion('');
    setEstado('ACTIVO');
    setIdArea('');
    setIdTipo('');
  };

  // Filtros, paginación y ordenamiento

  const filtered = useMemo(() => {
    if (!filterValue) return sitios;
    return sitios.filter((s) =>
      `${s.nombre} ${s.ubicacion} ${s.area?.nombreArea || ''} ${s.tipo_sitio?.nombre || ''}`
        .toLowerCase()
        .includes(filterValue.toLowerCase())
    );
  }, [sitios, filterValue]);

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

  // --- CORRECCIÓN: Se elimina el case para 'inventarios' ---
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
        return <span className="text-sm text-gray-600">{item.area?.nombreArea || '—'}</span>;
      case 'tipo':
        return <span className="text-sm text-gray-600">{item.tipo_sitio?.nombre || '—'}</span>;
      case 'actions':
        if (!permisos.puede_editar && !permisos.puede_eliminar) return null;
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]" aria-label="Opciones">
                <MoreVertical />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              {permisos.puede_editar ? (
                <DropdownItem key={`editar-${item.id}`} onPress={() => abrirModalEditar(item)}>
                  Editar
                </DropdownItem>
              ) : null}
              {permisos.puede_eliminar ? (
                <DropdownItem key={`eliminar-${item.id}`} onPress={() => eliminar(item.id)} className="text-danger">
                  Eliminar
                </DropdownItem>
              ) : null}
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return item[columnKey as keyof typeof item] || '—';
    }
  };

  // Toggle columnas visibles

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const copy = new Set(prev);
      if (copy.has(key)) copy.delete(key);
      else copy.add(key);
      return copy;
    });
  };

  // Contenido superior (filtros y controles)

  const topContent = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <Input
          isClearable
          className="w-full md:max-w-[44%]"
          radius="lg"
          placeholder="Buscar por nombre, ubicación, área o tipo"
          startContent={<SearchIcon className="text-[#0D1324]" />}
          value={filterValue}
          onValueChange={setFilterValue}
          onClear={() => setFilterValue('')}
          aria-label="Buscar sitios"
        />
        <div className="flex gap-3">
          {permisos.puede_crear ? (
            <Button
              className="bg-[#0D1324] hover:bg-[#1a2133] text-white font-medium rounded-lg shadow"
              endContent={<PlusIcon />}
              onPress={() => {
                limpiarForm();
                onOpen();
              }}
              aria-label="Nuevo sitio"
            >
              Nuevo Sitio
            </Button>
          ) : null}
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
        <span className="text-default-400 text-sm">Total {sitios.length} sitios</span>
        <label className="flex items-center text-default-400 text-sm">
          Filas por página:&nbsp;
          <select
            className="bg-transparent outline-none text-default-600 ml-1"
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
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

  // Contenido inferior (paginación)

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

  if (loading)
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center h-full p-6">
          <Spinner label="Cargando..." />
        </div>
      </DefaultLayout>
    );

  if (error || !permisos.puede_ver)
    return (
      <DefaultLayout>
        <div className="p-6 text-center text-red-600 flex flex-col items-center gap-4">
          <Lock size={48} />
          <h1 className="text-2xl font-bold">Acceso Denegado</h1>
          <p>{error || 'No tienes permiso para ver este módulo.'}</p>
        </div>
      </DefaultLayout>
    );

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">🏷️ Gestión de Sitios</h1>
          <p className="text-sm text-gray-600">
            Consulta y administra bodegas, ambientes y otros sitios.
          </p>
        </header>

        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de sitios"
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
            <TableBody items={sorted} emptyContent="No se encontraron sitios">
              {(item) => (
                <TableRow key={item.id}>{(col) => <TableCell>{renderCell(item, col as string)}</TableCell>}</TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Responsive cards */}
        <div className="grid gap-4 md:hidden">
          {sorted.length === 0 ? (
            <p className="text-center text-gray-500">No se encontraron sitios</p>
          ) : (
            sorted.map((s) => (
              <Card key={s.id} className="shadow-sm">
                <CardContent className="space-y-2 p-4">
                  <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg">{s.nombre}</h3>
                    {(permisos.puede_editar || permisos.puede_eliminar) && (
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
                          {permisos.puede_editar ? (
                            <DropdownItem key={`editar-${s.id}`} onPress={() => abrirModalEditar(s)}>
                              Editar
                            </DropdownItem>
                          ) : null}
                          {permisos.puede_eliminar ? (
                            <DropdownItem key={`eliminar-${s.id}`} onPress={() => eliminar(s.id)}>
                              Eliminar
                            </DropdownItem>
                          ) : null}
                        </DropdownMenu>
                      </Dropdown>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Ubicación:</span> {s.ubicacion}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Estado:</span>{' '}
                    <span className={s.estado === 'INACTIVO' ? 'text-red-600' : 'text-green-600'}>{s.estado}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Área:</span> {s.area?.nombreArea || '—'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Tipo:</span> {s.tipo_sitio?.nombre || '—'}
                  </p>
                  {/* --- CORRECCIÓN: Se elimina la línea que muestra el conteo de inventarios --- */}
                  <p className="text-xs text-gray-400">ID: {s.id}</p>
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
          aria-label="Formulario nuevo/editar sitio"
        >
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl max-w-md w-full p-6">
            {(onCloseLocal) => (
              <>
                <ModalHeader>{editId !== null ? 'Editar Sitio' : 'Nuevo Sitio'}</ModalHeader>
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
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Estado</label>
                    <select
                      value={estado}
                      onChange={(e) => setEstado(e.target.value as 'ACTIVO' | 'INACTIVO')}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Área</label>
                    <select
                      value={idArea}
                      onChange={(e) => setIdArea(Number(e.target.value) || '')}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccione un área</option>
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nombreArea}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Tipo de Sitio</label>
                    <select
                      value={idTipo}
                      onChange={(e) => setIdTipo(Number(e.target.value) || '')}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccione un tipo</option>
                      {tipos.map((t) => (
                        <option key={t.id} value={t.id}>
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