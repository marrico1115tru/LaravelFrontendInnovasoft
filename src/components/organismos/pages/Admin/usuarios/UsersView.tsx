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
  ModalHeader,
  Checkbox,
  Select,
  SelectItem,
  useDisclosure,
  type SortDescriptor,
  Spinner,
} from '@heroui/react';

import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from '@/Api/Usuariosform';

import { getAreas, createArea } from '@/Api/AreasService';
import { getFichasFormacion, createFichaFormacion } from '@/Api/fichasFormacion';
import { getRoles, createRol } from '@/Api/RolService';

import DefaultLayout from '@/layouts/default';
import { PlusIcon, MoreVertical, Search as SearchIcon, Lock } from 'lucide-react';

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import api from '@/Api/api'; // Asegúrate que api es tu axios configurado

const MySwal = withReactContent(Swal);

const columns = [
  { name: 'ID', uid: 'id', sortable: true },
  { name: 'Nombre', uid: 'nombreCompleto', sortable: false },
  { name: 'Cédula', uid: 'cedula', sortable: false },
  { name: 'Email', uid: 'email', sortable: false },
  { name: 'Teléfono', uid: 'telefono', sortable: false },
  { name: 'Área', uid: 'area', sortable: false },
  { name: 'Ficha', uid: 'ficha', sortable: false },
  { name: 'Rol', uid: 'rol', sortable: false },
  { name: 'Acciones', uid: 'actions' },
];

const INITIAL_VISIBLE_COLUMNS = [
  'id',
  'nombreCompleto',
  'cedula',
  'email',
  'telefono',
  'area',
  'ficha',
  'rol',
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

const UsuariosPage = () => {
  // Estados datos
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [fichas, setFichas] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  // Estados UI
  const [filterValue, setFilterValue] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'id',
    direction: 'ascending',
  });

  const {
    isOpen: userIsOpen,
    onOpen: userOnOpen,
    onClose: userOnClose,
    onOpenChange: userOnOpenChange,
  } = useDisclosure();

  const areaModal = useDisclosure();
  const fichaModal = useDisclosure();
  const rolModal = useDisclosure();

  // Formulario usuario
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    email: '',
    telefono: '',
    password: '',
    id_area: '',
    id_ficha: '',
    id_rol: '',
  });

  // Id de usuario que se edita (null si es nuevo)
  const [editId, setEditId] = useState<number | null>(null);

  // Para crear nuevas Área, Ficha y Rol
  const [newAreaName, setNewAreaName] = useState('');
  const [newFichaName, setNewFichaName] = useState('');
  const [newRolName, setNewRolName] = useState('');

  // Estados permisos y carga
  const [permisos, setPermisos] = useState({
    puede_ver: false,
    puede_crear: false,
    puede_editar: false,
    puede_eliminar: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carga inicial: permisos y datos
  useEffect(() => {
    const initialize = async () => {
      try {
        const userCookie = Cookies.get('user');
        if (!userCookie) throw new Error('No se encontró la sesión del usuario. Por favor, inicia sesión.');

        const user = JSON.parse(userCookie);
        const idRol = user?.id_rol;
        if (!idRol) throw new Error('Usuario sin rol válido.');

        const rutaActual = '/usuarios';
        const fetchedPermisos = await fetchPermisos(rutaActual, idRol);
        setPermisos(fetchedPermisos);

        if (!fetchedPermisos.puede_ver) {
          setError('No tienes permiso para ver este módulo.');
          return;
        }

        await cargarDatos();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  // Carga usuarios, áreas, fichas y roles
  const cargarDatos = async () => {
    try {
      const [usuariosApi, areasApi, fichasApi, rolesApi] = await Promise.all([
        getUsuarios(),
        getAreas(),
        getFichasFormacion(),
        getRoles(),
      ]);
      setUsuarios(usuariosApi);
      setAreas(areasApi);
      setFichas(fichasApi);
      setRoles(rolesApi);
    } catch (error) {
      console.error('Error cargando datos:', error);
      await MySwal.fire('Error', 'No se pudo cargar la información', 'error');
    }
  };

  // Confirmar y eliminar usuario
  const eliminarUsuario = async (id: number) => {
    if (!permisos.puede_eliminar) return;

    const result = await MySwal.fire({
      title: '¿Eliminar usuario?',
      text: 'Esta acción es irreversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await deleteUsuario(id);
      await MySwal.fire('Eliminado', `Usuario con ID ${id} eliminado correctamente`, 'success');
      await cargarDatos();
    } catch (error) {
      await MySwal.fire('Error', 'No se pudo eliminar el usuario', 'error');
    }
  };

  // Guardar usuario nuevo o editar existente con validación y control de permisos
  const guardarUsuario = async () => {
    if (!form.nombre.trim()) {
      await MySwal.fire('Atención', 'El campo Nombre es obligatorio', 'warning');
      return;
    }
    if (!form.id_area || !form.id_ficha || !form.id_rol) {
      await MySwal.fire('Atención', 'Debe seleccionar Área, Ficha y Rol', 'warning');
      return;
    }
    if (!editId && !form.password.trim()) {
      await MySwal.fire('Atención', 'La contraseña es obligatoria para crear un nuevo usuario', 'warning');
      return;
    }

    const payload: any = {
      nombre: form.nombre,
      apellido: form.apellido || null,
      cedula: form.cedula || null,
      email: form.email || null,
      telefono: form.telefono || null,
      id_area: form.id_area,
      id_ficha: form.id_ficha,
      id_rol: form.id_rol,
    };

    if (!editId) {
      payload.password = form.password;
    }

    try {
      if (editId) {
        if (!permisos.puede_editar) {
          await MySwal.fire('Acceso denegado', 'No tienes permiso para editar usuarios.', 'error');
          return;
        }
        await updateUsuario(editId, payload);
        await MySwal.fire('Éxito', 'Usuario actualizado correctamente', 'success');
      } else {
        if (!permisos.puede_crear) {
          await MySwal.fire('Acceso denegado', 'No tienes permiso para crear usuarios.', 'error');
          return;
        }
        await createUsuario(payload);
        await MySwal.fire('Éxito', 'Usuario creado correctamente', 'success');
      }
      userOnClose();
      limpiarFormulario();
      await cargarDatos();
    } catch (error: any) {
      console.error('Error guardando usuario:', error.response || error.message);
      await MySwal.fire(
        'Error',
        error.response?.data?.message || error.message || 'Error de servidor',
        'error',
      );
    }
  };

  // Limpiar formulario y estado edición
  const limpiarFormulario = () => {
    setForm({
      nombre: '',
      apellido: '',
      cedula: '',
      email: '',
      telefono: '',
      password: '',
      id_area: '',
      id_ficha: '',
      id_rol: '',
    });
    setEditId(null);
  };

  // Abrir modal para editar usuario
  const abrirModalEditar = (usuario: any) => {
    if (!permisos.puede_editar) {
      MySwal.fire('Acceso denegado', 'No tienes permiso para editar usuarios.', 'error');
      return;
    }
    setEditId(usuario.id);
    setForm({
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      cedula: usuario.cedula || '',
      email: usuario.email || '',
      telefono: usuario.telefono || '',
      password: '', // no mostrar contraseña
      id_area: usuario.area?.id?.toString() || usuario.id_area?.toString() || '',
      id_ficha: usuario.ficha?.id?.toString() || usuario.id_ficha?.toString() || '',
      id_rol: usuario.rol?.id?.toString() || usuario.id_rol?.toString() || '',
    });
    userOnOpen();
  };

  // Filtros, paginación, ordenamiento
  const usuariosFiltrados = useMemo(() => {
    if (!filterValue) return usuarios;
    return usuarios.filter((u) => {
      const texto = `${u.nombre} ${u.apellido ?? ''} ${u.cedula ?? ''} ${u.email ?? ''}`.toLowerCase();
      return texto.includes(filterValue.toLowerCase());
    });
  }, [usuarios, filterValue]);

  const totalPaginas = Math.max(Math.ceil(usuariosFiltrados.length / rowsPerPage), 1);

  const usuariosPaginados = useMemo(() => {
    const inicio = (page - 1) * rowsPerPage;
    return usuariosFiltrados.slice(inicio, inicio + rowsPerPage);
  }, [usuariosFiltrados, page, rowsPerPage]);

  const usuariosOrdenados = useMemo(() => {
    const items = [...usuariosPaginados];
    const { column, direction } = sortDescriptor;
    items.sort((a, b) => {
      if (column === 'nombreCompleto') {
        const nombreA = (a.nombre + ' ' + (a.apellido || '')).toLowerCase();
        const nombreB = (b.nombre + ' ' + (b.apellido || '')).toLowerCase();
        if (nombreA === nombreB) return 0;
        return (nombreA > nombreB ? 1 : -1) * (direction === 'ascending' ? 1 : -1);
      }
      const valA = a[column];
      const valB = b[column];
      if (valA === valB) return 0;
      return (valA > valB ? 1 : -1) * (direction === 'ascending' ? 1 : -1);
    });
    return items;
  }, [usuariosPaginados, sortDescriptor]);

  // Renderizado celdas, respetando permisos para acciones
  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case 'nombreCompleto':
        return (
          <span className="font-medium text-gray-800 break-words max-w-[16rem]">
            {item.nombre} {item.apellido ?? ''}
          </span>
        );
      case 'area':
        return <span className="text-sm text-gray-600">{item.area?.nombre_area ?? '—'}</span>;
      case 'ficha':
        return <span className="text-sm text-gray-600">{item.ficha?.nombre ?? '—'}</span>;
      case 'rol':
        return <span className="text-sm text-gray-600">{item.rol?.nombre_rol ?? '—'}</span>;
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
                <DropdownItem key={`editar-${item.id}`} onPress={() => abrirModalEditar(item)}>
                  Editar
                </DropdownItem>
              ) : null}
              {permisos.puede_eliminar ? (
                <DropdownItem
                  key={`eliminar-${item.id}`}
                  onPress={() => eliminarUsuario(item.id)}
                  className="text-danger"
                >
                  Eliminar
                </DropdownItem>
              ) : null}
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return item[columnKey as keyof typeof item] ?? '—';
    }
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const copia = new Set(prev);
      if (copia.has(key)) copia.delete(key);
      else copia.add(key);
      return copia;
    });
  };

  // Métodos para crear nueva Área, Ficha y Rol
  const guardarNuevaArea = async () => {
    if (!newAreaName.trim()) {
      await MySwal.fire('Atención', 'El nombre del área es obligatorio', 'warning');
      return;
    }
    try {
      await createArea({ nombreArea: newAreaName.trim() });
      await MySwal.fire('Éxito', 'Área creada correctamente', 'success');
      setNewAreaName('');
      areaModal.onClose();
      await cargarDatos();
    } catch (error) {
      console.error('Error creando área:', error);
      await MySwal.fire('Error', 'No se pudo crear el área', 'error');
    }
  };

  const guardarNuevaFicha = async () => {
    if (!newFichaName.trim()) {
      await MySwal.fire('Atención', 'El nombre de la ficha es obligatorio', 'warning');
      return;
    }
    try {
      await createFichaFormacion({
        nombre: newFichaName.trim(),
        id_titulado: 0,
      });
      await MySwal.fire('Éxito', 'Ficha creada correctamente', 'success');
      setNewFichaName('');
      fichaModal.onClose();
      await cargarDatos();
    } catch (error) {
      console.error('Error creando ficha:', error);
      await MySwal.fire('Error', 'No se pudo crear la ficha', 'error');
    }
  };

  const guardarNuevoRol = async () => {
    if (!newRolName.trim()) {
      await MySwal.fire('Atención', 'El nombre del rol es obligatorio', 'warning');
      return;
    }
    try {
      await createRol({ nombreRol: newRolName.trim() });
      await MySwal.fire('Éxito', 'Rol creado correctamente', 'success');
      setNewRolName('');
      rolModal.onClose();
      await cargarDatos();
    } catch (error) {
      console.error('Error creando rol:', error);
      await MySwal.fire('Error', 'No se pudo crear el rol', 'error');
    }
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

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6">
        {/* Encabezado */}
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">👥 Gestión de Usuarios</h1>
          <p className="text-sm text-gray-600">Consulta y administra los usuarios registrados.</p>
        </header>

        {/* Tabla escritorio */}
        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de usuarios"
            isHeaderSticky
            topContent={
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                  <Input
                    isClearable
                    className="w-full md:max-w-[44%]"
                    radius="lg"
                    placeholder="Buscar por nombre, cédula o email"
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
                          .filter((col) => col.uid !== 'actions')
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
                          limpiarFormulario();
                          userOnOpen();
                        }}
                      >
                        Nuevo Usuario
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-default-400 text-sm">Total {usuarios.length} usuarios</span>
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
                      {[5, 10, 15].map((numero) => (
                        <option key={numero} value={numero}>
                          {numero}
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
                <Pagination
                  isCompact
                  showControls
                  page={page}
                  total={totalPaginas}
                  onChange={setPage}
                />
                <Button size="sm" variant="flat" isDisabled={page === totalPaginas} onPress={() => setPage(page + 1)}>
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
            <TableHeader columns={columns.filter((col) => visibleColumns.has(col.uid))}>
              {(col) => (
                <TableColumn
                  key={col.uid}
                  align={col.uid === 'actions' ? 'center' : 'start'}
                  width={col.uid === 'nombreCompleto' ? 260 : undefined}
                >
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={usuariosOrdenados} emptyContent="No se encontraron usuarios">
              {(item) => (
                <TableRow key={item.id}>
                  {(col) => <TableCell>{renderCell(item, String(col))}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modal Crear/Editar Usuario */}
        <Modal
          isOpen={userIsOpen}
          onOpenChange={userOnOpenChange}
          placement="center"
          className="backdrop-blur-sm bg-black/30"
          isDismissable={false}
        >
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl max-w-3xl w-full p-8">
            <>
              <ModalHeader className="mb-4 text-xl font-semibold text-[#0D1324]">
                {editId ? 'Editar Usuario' : 'Nuevo Usuario'}
              </ModalHeader>
              <ModalBody>
                <form
                  className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4"
                  onSubmit={(evento) => {
                    evento.preventDefault();
                    guardarUsuario();
                  }}
                >
                  <Input
                    label="Nombre"
                    value={form.nombre}
                    onValueChange={(valor) => setForm((p) => ({ ...p, nombre: valor }))}
                    radius="sm"
                    required
                  />
                  <Input
                    label="Apellido"
                    value={form.apellido}
                    onValueChange={(valor) => setForm((p) => ({ ...p, apellido: valor }))}
                    radius="sm"
                  />
                  <Input
                    label="Cédula"
                    value={form.cedula}
                    onValueChange={(valor) => setForm((p) => ({ ...p, cedula: valor }))}
                    radius="sm"
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={form.email}
                    onValueChange={(valor) => setForm((p) => ({ ...p, email: valor }))}
                    radius="sm"
                  />
                  <Input
                    label="Teléfono"
                    value={form.telefono}
                    onValueChange={(valor) => setForm((p) => ({ ...p, telefono: valor }))}
                    radius="sm"
                  />
                  {!editId && (
                    <Input
                      label="Contraseña"
                      type="password"
                      value={form.password}
                      onValueChange={(valor) => setForm((p) => ({ ...p, password: valor }))}
                      radius="sm"
                      required
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <Select
                      label="Área"
                      selectedKeys={form.id_area ? new Set([form.id_area]) : new Set()}
                      onSelectionChange={(keys) =>
                        setForm((p) => ({ ...p, id_area: String(Array.from(keys)[0]) }))
                      }
                      radius="sm"
                      className="flex-grow"
                    >
                      {areas.map((area) => (
                        <SelectItem key={String(area.id)}>{area.nombre_area || area.nombreArea}</SelectItem>
                      ))}
                    </Select>
                    <Button
                      isIconOnly
                      variant="solid"
                      className="bg-[#0D1324] hover:bg-[#1a2133] text-white"
                      onPress={areaModal.onOpen}
                      aria-label="Agregar Área"
                      title="Agregar Área"
                    >
                      <PlusIcon size={18} />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      label="Ficha de Formación"
                      selectedKeys={form.id_ficha ? new Set([form.id_ficha]) : new Set()}
                      onSelectionChange={(keys) =>
                        setForm((p) => ({ ...p, id_ficha: String(Array.from(keys)[0]) }))
                      }
                      radius="sm"
                      className="flex-grow"
                    >
                      {fichas.map((ficha) => (
                        <SelectItem key={String(ficha.id)}>{ficha.nombre}</SelectItem>
                      ))}
                    </Select>
                    <Button
                      isIconOnly
                      variant="solid"
                      className="bg-[#0D1324] hover:bg-[#1a2133] text-white"
                      onPress={fichaModal.onOpen}
                      aria-label="Agregar Ficha de Formación"
                      title="Agregar Ficha de Formación"
                    >
                      <PlusIcon size={18} />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      label="Rol"
                      selectedKeys={form.id_rol ? new Set([form.id_rol]) : new Set()}
                      onSelectionChange={(keys) =>
                        setForm((p) => ({ ...p, id_rol: String(Array.from(keys)[0]) }))
                      }
                      radius="sm"
                      className="flex-grow"
                    >
                      {roles.map((rol) => (
                        <SelectItem key={String(rol.id)}>{rol.nombre_rol || rol.nombreRol}</SelectItem>
                      ))}
                    </Select>
                    <Button
                      isIconOnly
                      variant="solid"
                      className="bg-[#0D1324] hover:bg-[#1a2133] text-white"
                      onPress={rolModal.onOpen}
                      aria-label="Agregar Rol"
                      title="Agregar Rol"
                    >
                      <PlusIcon size={18} />
                    </Button>
                  </div>
                  <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                    <Button variant="light" onClick={userOnClose} type="button">
                      Cancelar
                    </Button>
                    <Button variant="flat" type="submit">
                      {editId ? 'Actualizar' : 'Crear'}
                    </Button>
                  </div>
                </form>
              </ModalBody>
            </>
          </ModalContent>
        </Modal>

        {/* Modal Nueva Área */}
        <Modal
          isOpen={areaModal.isOpen}
          onOpenChange={areaModal.onOpenChange}
          placement="center"
          className="backdrop-blur-sm bg-black/30"
          isDismissable
        >
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl max-w-md p-6">
            <>
              <ModalHeader>Nueva Área</ModalHeader>
              <ModalBody>
                <Input
                  label="Nombre del área"
                  value={newAreaName}
                  onValueChange={setNewAreaName}
                  radius="sm"
                  autoFocus
                />
              </ModalBody>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="light" onPress={areaModal.onClose}>
                  Cancelar
                </Button>
                <Button variant="flat" onPress={guardarNuevaArea}>
                  Crear
                </Button>
              </div>
            </>
          </ModalContent>
        </Modal>

        {/* Modal Nueva Ficha de Formación */}
        <Modal
          isOpen={fichaModal.isOpen}
          onOpenChange={fichaModal.onOpenChange}
          placement="center"
          className="backdrop-blur-sm bg-black/30"
          isDismissable
        >
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl max-w-md p-6">
            <>
              <ModalHeader>Nueva Ficha de Formación</ModalHeader>
              <ModalBody>
                <Input
                  label="Nombre de la ficha"
                  value={newFichaName}
                  onValueChange={setNewFichaName}
                  radius="sm"
                  autoFocus
                />
              </ModalBody>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="light" onPress={fichaModal.onClose}>
                  Cancelar
                </Button>
                <Button variant="flat" onPress={guardarNuevaFicha}>
                  Crear
                </Button>
              </div>
            </>
          </ModalContent>
        </Modal>

        {/* Modal Nuevo Rol */}
        <Modal
          isOpen={rolModal.isOpen}
          onOpenChange={rolModal.onOpenChange}
          placement="center"
          className="backdrop-blur-sm bg-black/30"
          isDismissable
        >
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl max-w-md p-6">
            <>
              <ModalHeader>Nuevo Rol</ModalHeader>
              <ModalBody>
                <Input
                  label="Nombre del rol"
                  value={newRolName}
                  onValueChange={setNewRolName}
                  radius="sm"
                  autoFocus
                />
              </ModalBody>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="light" onPress={rolModal.onClose}>
                  Cancelar
                </Button>
                <Button variant="flat" onPress={guardarNuevoRol}>
                  Crear
                </Button>
              </div>
            </>
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
};

export default UsuariosPage;
