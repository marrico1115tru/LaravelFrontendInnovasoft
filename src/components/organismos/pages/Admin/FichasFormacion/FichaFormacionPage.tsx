import { useEffect, useState, useMemo } from 'react';
import Cookies from 'js-cookie';
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
  getFichasFormacion,
  createFichaFormacion,
  updateFichaFormacion,
  deleteFichaFormacion,
} from '@/Api/fichasFormacion';

import { getTitulados } from '@/Api/TituladosService';
import { getUsuarios } from '@/Api/Usuariosform';

import api from '@/Api/api'; // Instancia axios configurada

import DefaultLayout from '@/layouts/default';

import { PlusIcon, MoreVertical, Search as SearchIcon, Lock as LockIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

// --- CORRECCIÓN: Se eliminan las columnas '# Usuarios' y '# Entregas' ---
const columns = [
  { name: 'ID', uid: 'id', sortable: true },
  { name: 'Nombre', uid: 'nombre', sortable: false },
  { name: 'Titulado', uid: 'titulado', sortable: false },
  { name: 'Responsable', uid: 'responsable', sortable: false },
  { name: 'Acciones', uid: 'actions' },
];

// --- CORRECCIÓN: Se quitan 'usuarios' y 'entregas' de las columnas visibles iniciales ---
const INITIAL_VISIBLE_COLUMNS = [
  'id',
  'nombre',
  'titulado',
  'responsable',
  'actions',
];

// Función para obtener permisos desde el API
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

export default function FichasFormacionPage() {
  const [fichas, setFichas] = useState<any[]>([]);
  const [titulados, setTitulados] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [filterValue, setFilterValue] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'id',
    direction: 'ascending',
  });

  const [nombre, setNombre] = useState('');
  const [idTitulado, setIdTitulado] = useState('');
  const [idResponsable, setIdResponsable] = useState('');
  const [editId, setEditId] = useState<number | null>(null);

  const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure();

  // Estados para permisos y carga/error
  const [permisos, setPermisos] = useState({
    puede_ver: false,
    puede_crear: false,
    puede_editar: false,
    puede_eliminar: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar permisos y datos al montar el componente
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        const userCookie = Cookies.get('user');
        if (!userCookie) throw new Error('No se encontró la sesión del usuario. Por favor, inicie sesión de nuevo.');
        const user = JSON.parse(userCookie);
        const idRol = user?.id_rol;
        if (!idRol) throw new Error('El usuario no tiene un rol válido asignado.');

        const rutaActual = '/FichaFormacionPage';
        const fetchedPermisos = await fetchPermisos(rutaActual, idRol);
        setPermisos(fetchedPermisos);

        if (fetchedPermisos.puede_ver) {
          await cargarDatos();
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const cargarDatos = async () => {
    try {
      const [fichasData, tituladosData, usuariosData] = await Promise.all([
        getFichasFormacion(),
        getTitulados(),
        getUsuarios(),
      ]);
      setFichas(fichasData);
      setTitulados(tituladosData);
      setUsuarios(usuariosData);
    } catch (error) {
      console.error('Error cargando fichas:', error);
      await MySwal.fire('Error', 'No se pudo cargar la información', 'error');
    }
  };

  const eliminar = async (id: number) => {
    const result = await MySwal.fire({
      title: '¿Eliminar ficha?',
      text: 'No se podrá recuperar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;

    try {
      await deleteFichaFormacion(id);
      await MySwal.fire('Eliminada', `Ficha eliminada: ID ${id}`, 'success');
      cargarDatos();
    } catch (error) {
      console.error(error);
      await MySwal.fire('Error', 'Error eliminando ficha', 'error');
    }
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      await MySwal.fire('Error', 'El nombre es obligatorio', 'error');
      return;
    }
    if (!idTitulado) {
      await MySwal.fire('Error', 'Debes seleccionar un titulado', 'error');
      return;
    }
    const payload = {
      nombre: nombre.trim(),
      id_titulado: Number(idTitulado),
      id_usuario_responsable: idResponsable ? Number(idResponsable) : null,
    };

    try {
      if (editId !== null) {
        await updateFichaFormacion(editId, payload);
        await MySwal.fire('Actualizado', 'Ficha actualizada correctamente', 'success');
      } else {
        await createFichaFormacion(payload);
        await MySwal.fire('Creado', 'Ficha creada correctamente', 'success');
      }
      onClose();
      limpiarForm();
      cargarDatos();
    } catch (error) {
      console.error(error);
      await MySwal.fire('Error', 'Error guardando ficha', 'error');
    }
  };

  const abrirModalEditar = (ficha: any) => {
    if (!permisos.puede_editar) return; // Bloquear si no tiene permiso

    setEditId(ficha.id);
    setNombre(ficha.nombre);
    setIdTitulado(ficha.id_titulado?.toString() || ficha.titulado?.id?.toString() || '');
    setIdResponsable(
      ficha.id_usuario_responsable?.toString() || ficha.usuario_responsable?.id?.toString() || ''
    );
    onOpen();
  };

  const limpiarForm = () => {
    setEditId(null);
    setNombre('');
    setIdTitulado('');
    setIdResponsable('');
  };

  const filtered = useMemo(() => {
    if (!filterValue) return fichas;
    const fv = filterValue.toLowerCase();
    return fichas.filter((f) =>
      `${f.nombre} ${f.titulado?.nombre || ''} ${
        f.usuario_responsable ? `${f.usuario_responsable.nombre} ${f.usuario_responsable.apellido ?? ''}` : ''
      }`
        .toLowerCase()
        .includes(fv)
    );
  }, [fichas, filterValue]);

  const pages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const sliced = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const sorted = useMemo(() => {
    return [...sliced].sort((a, b) => {
      const { column, direction } = sortDescriptor;
      const x = a[column as keyof typeof a];
      const y = b[column as keyof typeof b];
      if (x === y) return 0;
      return (x > y ? 1 : -1) * (direction === 'ascending' ? 1 : -1);
    });
  }, [sliced, sortDescriptor]);

  // --- CORRECCIÓN: Se eliminan los 'case' para 'usuarios' y 'entregas' ---
  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case 'nombre':
        return <span className="font-medium text-gray-800 break-words max-w-[16rem]">{item.nombre}</span>;
      case 'titulado':
        return <span className="text-sm text-gray-600">{item.titulado?.nombre ?? '—'}</span>;
      case 'responsable':
        return (
          <span className="text-sm text-gray-600">
            {item.usuario_responsable ? `${item.usuario_responsable.nombre} ${item.usuario_responsable.apellido ?? ''}` : '—'}
          </span>
        );
      case 'actions':
        if (!permisos.puede_editar && !permisos.puede_eliminar) return null;
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]">
                <MoreVertical />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              {permisos.puede_editar ? (
                <DropdownItem onPress={() => abrirModalEditar(item)} key={`editar-${item.id}`}>
                  Editar
                </DropdownItem>
              ) : null}
              {permisos.puede_eliminar ? (
                <DropdownItem onPress={() => eliminar(item.id)} key={`eliminar-${item.id}`}>
                  Eliminar
                </DropdownItem>
              ) : null}
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return item[columnKey as keyof typeof item];
    }
  };

  const toggleColumn = (uid: string) => {
    setVisibleColumns((prev) => {
      const copy = new Set(prev);
      copy.has(uid) ? copy.delete(uid) : copy.add(uid);
      return copy;
    });
  };

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex justify-center items-center h-full p-6">
          <Spinner label="Cargando..." />
        </div>
      </DefaultLayout>
    );
  }

  if (error || !permisos.puede_ver) {
    return (
      <DefaultLayout>
        <div className="p-6 text-center text-red-600 flex flex-col items-center gap-4">
          <LockIcon size={48} />
          <h1 className="text-2xl font-bold">Acceso Denegado</h1>
          <p>{error || 'No tienes permiso para ver este módulo.'}</p>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">🎓 Gestión de Fichas de Formación</h1>
          <p className="text-sm text-gray-600">Consulta y administra las fichas académicas.</p>
        </header>

        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de fichas"
            isHeaderSticky
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            classNames={{
              th: 'py-3 px-4 bg-[#e8ecf4] text-[#0D1324] font-semibold text-sm',
              td: 'align-middle py-3 px-4',
            }}
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
                            <DropdownItem key={col.uid} onPress={() => toggleColumn(col.uid)}>
                              <Checkbox isSelected={visibleColumns.has(col.uid)} readOnly />
                              {col.name}
                            </DropdownItem>
                          ))}
                      </DropdownMenu>
                    </Dropdown>
                    {permisos.puede_crear ? (
                      <Button
                        className="bg-[#0D1324] hover:bg-[#1a2133] text-white font-medium rounded-lg shadow"
                        endContent={<PlusIcon />}
                        onPress={() => {
                          limpiarForm();
                          onOpen();
                        }}
                      >
                        Nueva Ficha
                      </Button>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-default-400 text-sm">Total {fichas.length} fichas</span>
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
          >
            <TableHeader columns={columns.filter((c) => visibleColumns.has(c.uid))}>
              {(col) => (
                <TableColumn key={col.uid} align={col.uid === 'actions' ? 'center' : 'start'} width={col.uid === 'nombre' ? 300 : undefined}>
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

        {/* Mobile cards */}
        <div className="grid gap-4 md:hidden">
          {sorted.length === 0 && <p className="text-center text-gray-500">No se encontraron fichas</p>}
          {sorted.map((ficha) => (
            <Card key={ficha.id} className="shadow-sm">
              <CardContent className="space-y-2 p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg break-words max-w-[14rem]">{ficha.nombre}</h3>
                  {(permisos.puede_editar || permisos.puede_eliminar) && (
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]">
                          <MoreVertical />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        {permisos.puede_editar ? (
                          <DropdownItem onPress={() => abrirModalEditar(ficha)} key={`editar-mobile-${ficha.id}`}>
                            Editar
                          </DropdownItem>
                        ) : null}
                        {permisos.puede_eliminar ? (
                          <DropdownItem onPress={() => eliminar(ficha.id)} key={`eliminar-mobile-${ficha.id}`}>
                            Eliminar
                          </DropdownItem>
                        ) : null}
                      </DropdownMenu>
                    </Dropdown>
                  )}
                </div>
                <p className="text-sm text-gray-600">Titulado: {ficha.titulado?.nombre || '—'}</p>
                <p className="text-sm text-gray-600">
                  Responsable: {ficha.usuario_responsable ? `${ficha.usuario_responsable.nombre} ${ficha.usuario_responsable.apellido ?? ''}` : '—'}
                </p>
                {/* --- CORRECCIÓN: Se eliminan las líneas que muestran el conteo de usuarios y entregas --- */}
                <p className="text-xs text-gray-400">ID: {ficha.id}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal */}
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" className="backdrop-blur-sm bg-black/30" isDismissable={false}>
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl max-w-md w-full p-6">
            {(onCloseLocal) => (
              <>
                <ModalHeader>{editId ? 'Editar Ficha' : 'Nueva Ficha'}</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input label="Nombre" placeholder="Ej: Ficha 2567890 - ADSI" value={nombre} onValueChange={setNombre} radius="sm" />
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Titulado</label>
                    <select value={idTitulado} onChange={(e) => setIdTitulado(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Seleccione un titulado</option>
                      {titulados.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Responsable</label>
                    <select value={idResponsable} onChange={(e) => setIdResponsable(e.target.value)} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Seleccione un responsable</option>
                      {usuarios.map((u) => (
                        <option key={u.id} value={u.id}>
                          {`${u.nombre} ${u.apellido ?? ''}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onCloseLocal}>
                    Cancelar
                  </Button>
                  <Button variant="flat" onPress={guardar} isDisabled={!permisos.puede_crear && editId === null}>
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
}