import { useEffect, useMemo, useState } from 'react';
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
  getRoles,
  createRol,
  updateRol,
  deleteRol,
} from '@/Api/RolService';
import DefaultLayout from '@/layouts/default';
import { PlusIcon, MoreVertical, Search as SearchIcon, Lock, Pencil, Trash } from 'lucide-react';

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import api from '@/Api/api';

const MySwal = withReactContent(Swal);

// --- CORRECCIÓN: Se eliminan las columnas 'Usuarios' y 'Permisos' ---
const columns = [
  { name: 'ID', uid: 'id', sortable: true },
  { name: 'Rol', uid: 'rol', sortable: false },
  { name: 'Acciones', uid: 'actions' },
];

// --- CORRECCIÓN: Se quitan 'usuarios' y 'permisos' de las columnas visibles iniciales ---
const INITIAL_VISIBLE_COLUMNS = ['id', 'rol', 'actions'];

// Función para obtener los permisos del usuario por ruta y rol
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

const RolesPage = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [filterValue, setFilterValue] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'id',
    direction: 'ascending',
  });

  const [nombreRol, setNombreRol] = useState('');
  const [editId, setEditId] = useState<number | null>(null);

  const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure();

  const [permisos, setPermisos] = useState({
    puede_ver: false,
    puede_crear: false,
    puede_editar: false,
    puede_eliminar: false,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar permisos y luego datos
  useEffect(() => {
    const initialize = async () => {
      try {
        const userCookie = Cookies.get('user');
        if (!userCookie) throw new Error('No se encontró la sesión del usuario. Por favor, inicie sesión de nuevo.');

        const user = JSON.parse(userCookie);
        const idRol = user?.id_rol;
        if (!idRol) throw new Error('El usuario no tiene un rol válido asignado.');

        const rutaActual = '/RolesPage';
        const fetchedPermisos = await fetchPermisos(rutaActual, idRol);
        setPermisos(fetchedPermisos);

        if (fetchedPermisos.puede_ver) {
          await cargarRoles();
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  const cargarRoles = async () => {
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      console.error('Error cargando roles', err);
      await MySwal.fire('Error', 'No se pudo cargar los roles', 'error');
    }
  };

  const eliminar = async (id: number) => {
    if (!permisos.puede_eliminar) return;

    const result = await MySwal.fire({
      title: '¿Eliminar rol?',
      text: 'No se podrá recuperar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;

    try {
      await deleteRol(id);
      await MySwal.fire('Eliminado', `Rol eliminado: ID ${id}`, 'success');
      await cargarRoles();
    } catch (error) {
      console.error(error);
      await MySwal.fire('Error', 'No se pudo eliminar el rol', 'error');
    }
  };

  const guardar = async () => {
    if (!nombreRol.trim()) {
      await MySwal.fire('Error', 'El nombre del rol es obligatorio', 'error');
      return;
    }
    const payload = { nombreRol };
    try {
      if (editId !== null) {
        if (!permisos.puede_editar) {
          await MySwal.fire('Acceso denegado', 'No tienes permiso para editar roles.', 'error');
          return;
        }
        await updateRol(editId, payload);
        await MySwal.fire('Actualizado', 'Rol actualizado', 'success');
      } else {
        if (!permisos.puede_crear) {
          await MySwal.fire('Acceso denegado', 'No tienes permiso para crear roles.', 'error');
          return;
        }
        await createRol(payload);
        await MySwal.fire('Creado', 'Rol creado', 'success');
      }
      limpiarForm();
      onClose();
      await cargarRoles();
    } catch (error) {
      console.error(error);
      await MySwal.fire('Error', 'Error guardando rol', 'error');
    }
  };

  const abrirModalEditar = (r: any) => {
    if (!permisos.puede_editar) {
      MySwal.fire('Acceso denegado', 'No tienes permiso para editar roles.', 'error');
      return;
    }
    setEditId(r.id);
    setNombreRol(r.nombre_rol || r.nombreRol || '');
    onOpen();
  };

  const limpiarForm = () => {
    setEditId(null);
    setNombreRol('');
  };

  const filtered = useMemo(() => {
    if (!filterValue) return roles;
    return roles.filter((r) =>
      `${r.nombre_rol || r.nombreRol}`.toLowerCase().includes(filterValue.toLowerCase())
    );
  }, [roles, filterValue]);

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

  // --- CORRECCIÓN: Se eliminan los 'case' para 'usuarios' y 'permisos' ---
  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case 'rol':
        return (
          <span className="font-medium text-gray-800 break-words max-w-[18rem]">
            {item.nombre_rol || item.nombreRol}
          </span>
        );
      case 'actions':
        if (!permisos.puede_editar && !permisos.puede_eliminar) return null;
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
              {permisos.puede_editar ? (
                <DropdownItem
                  key={`editar-${item.id}`}
                  onPress={() => abrirModalEditar(item)}
                  startContent={<Pencil size={16} />}
                >
                  Editar
                </DropdownItem>
              ) : null}
              {permisos.puede_eliminar ? (
                <DropdownItem
                  key={`eliminar-${item.id}`}
                  onPress={() => eliminar(item.id)}
                  startContent={<Trash size={16} />}
                  className="text-danger"
                >
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

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const copy = new Set(prev);
      if (copy.has(key)) copy.delete(key);
      else copy.add(key);
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
          <Lock size={48} />
          <h1 className="text-2xl font-bold">Acceso Denegado</h1>
          <p>{error || 'No tienes permiso para ver este módulo.'}</p>
        </div>
      </DefaultLayout>
    );
  }

  const topContent = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <Input
          isClearable
          className="w-full md:max-w-[44%]"
          radius="lg"
          placeholder="Buscar por nombre de rol"
          startContent={<SearchIcon className="text-[#0D1324]" />}
          value={filterValue}
          onValueChange={setFilterValue}
          onClear={() => setFilterValue('')}
          aria-label="Buscar roles"
        />
        <div className="flex gap-3">
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
          {permisos.puede_crear && (
            <Button
              className="bg-[#0D1324] hover:bg-[#1a2133] text-white font-medium rounded-lg shadow"
              endContent={<PlusIcon />}
              onPress={() => {
                limpiarForm();
                onOpen();
              }}
              aria-label="Nuevo rol"
            >
              Nuevo Rol
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-default-400 text-sm">Total {roles.length} roles</span>
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
        aria-label="Página anterior"
      >
        Anterior
      </Button>
      <Pagination isCompact showControls page={page} total={pages} onChange={setPage} />
      <Button
        size="sm"
        variant="flat"
        isDisabled={page === pages}
        onPress={() => setPage(page + 1)}
        aria-label="Página siguiente"
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
            🛡️ Gestión de Roles
          </h1>
          <p className="text-sm text-gray-600">Consulta y administra los roles y sus permisos.</p>
        </header>

        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de roles"
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
                  width={col.uid === 'rol' ? 300 : undefined}
                >
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={sorted} emptyContent="No se encontraron roles">
              {(item) => (
                <TableRow key={item.id}>
                  {(col) => <TableCell>{renderCell(item, col as string)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Aquí podrías agregar versión móvil si quieres */}

        <Modal
          isOpen={isOpen}
          onOpenChange={onOpenChange}
          placement="center"
          className="backdrop-blur-sm bg-black/30"
          isDismissable={false}
          aria-label="Formulario nuevo/editar rol"
        >
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl max-w-md w-full p-6">
            <>
              <ModalHeader>{editId !== null ? 'Editar Rol' : 'Nuevo Rol'}</ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label="Nombre del rol"
                  placeholder="Ej: Administrador"
                  value={nombreRol}
                  onValueChange={setNombreRol}
                  radius="sm"
                  autoFocus
                />
              </ModalBody>
              <ModalFooter className="flex justify-end gap-3">
                <Button variant="light" onPress={onClose}>
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
};

export default RolesPage;