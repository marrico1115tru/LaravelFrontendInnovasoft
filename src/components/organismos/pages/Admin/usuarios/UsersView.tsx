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
  ModalHeader,
  Checkbox,
  Select,
  SelectItem,
  useDisclosure,
  type SortDescriptor,
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
import { PlusIcon, MoreVertical, Search as SearchIcon } from 'lucide-react';

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

// Configuración para SweetAlert
const MySwal = withReactContent(Swal);

// Columnas de la tabla usuarios
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

// Columnas visibles por defecto
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

// Componente principal
const UsuariosPage = () => {
  // Estados para datos
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [fichas, setFichas] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  // Otros estados UI
  const [filterValue, setFilterValue] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'id',
    direction: 'ascending',
  });

  // Control para modal usuario
  const {
    isOpen: userIsOpen,
    onOpen: userOnOpen,
    onClose: userOnClose,
    onOpenChange: userOnOpenChange,
  } = useDisclosure();

  // Control para modales de agregar Área, Ficha y Rol
  const areaModal = useDisclosure();
  const fichaModal = useDisclosure();
  const rolModal = useDisclosure();

  // Estado formulario usuario, con keys en snake_case conforme backend
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

  // Para editar: guarda ID usuario editando o null para nuevo
  const [editId, setEditId] = useState<number | null>(null);

  // Para crear nuevas área, ficha, rol
  const [newAreaName, setNewAreaName] = useState('');
  const [newFichaName, setNewFichaName] = useState('');
  const [newRolName, setNewRolName] = useState('');

  // Carga inicial de todos los datos
  useEffect(() => {
    cargarDatos();
  }, []);

  // Función para cargar usuarios, áreas, fichas y roles
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

  // Función para eliminar usuario con confirmación
  const eliminarUsuario = async (id: number) => {
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

  // Guardar nuevo usuario o actualizar existente con validación básica
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

    // Preparar datos a enviar
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
        await updateUsuario(editId, payload);
        await MySwal.fire('Éxito', 'Usuario actualizado correctamente', 'success');
      } else {
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

  // Limpiar formulario al cerrar
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

  // Abrir modal para editar usuario, cargando los datos existentes
  const abrirModalEditar = (usuario: any) => {
    setEditId(usuario.id);
    setForm({
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      cedula: usuario.cedula || '',
      email: usuario.email || '',
      telefono: usuario.telefono || '',
      password: '', // contraseña vacía porque no se muestra
      id_area: usuario.area?.id?.toString() || usuario.id_area?.toString() || '',
      id_ficha: usuario.ficha?.id?.toString() || usuario.id_ficha?.toString() || '',
      id_rol: usuario.rol?.id?.toString() || usuario.id_rol?.toString() || '',
    });
    userOnOpen();
  };

  // Filtrado local de usuarios por texto buscado
  const usuariosFiltrados = useMemo(() => {
    if (!filterValue) return usuarios;
    return usuarios.filter((u) => {
      const texto = `${u.nombre} ${u.apellido ?? ''} ${u.cedula ?? ''} ${u.email ?? ''}`.toLowerCase();
      return texto.includes(filterValue.toLowerCase());
    });
  }, [usuarios, filterValue]);

  // Calcular cantidad de páginas para paginación
  const totalPaginas = Math.max(Math.ceil(usuariosFiltrados.length / rowsPerPage), 1);

  // Usuarios paginados
  const usuariosPaginados = useMemo(() => {
    const inicio = (page - 1) * rowsPerPage;
    return usuariosFiltrados.slice(inicio, inicio + rowsPerPage);
  }, [usuariosFiltrados, page, rowsPerPage]);

  // Usuarios ordenados por sortDescriptor
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

  // Renderizado de celdas según columna
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
              <DropdownItem key={`eliminar-${item.id}`} onPress={() => eliminarUsuario(item.id)}>
                Eliminar
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return item[columnKey as keyof typeof item] ?? '—';
    }
  };

  // Cambiar columnas visibles
  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const copia = new Set(prev);
      if (copia.has(key)) copia.delete(key);
      else copia.add(key);
      return copia;
    });
  };

  // Métodos para crear nueva Área, Ficha y Rol

  // Crear Área
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

  // Crear Ficha
  const guardarNuevaFicha = async () => {
    if (!newFichaName.trim()) {
      await MySwal.fire('Atención', 'El nombre de la ficha es obligatorio', 'warning');
      return;
    }
    try {
      await createFichaFormacion({ nombre: newFichaName.trim() });
      await MySwal.fire('Éxito', 'Ficha creada correctamente', 'success');
      setNewFichaName('');
      fichaModal.onClose();
      await cargarDatos();
    } catch (error) {
      console.error('Error creando ficha:', error);
      await MySwal.fire('Error', 'No se pudo crear la ficha', 'error');
    }
  };

  // Crear Rol
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

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6">
        {/* Encabezado */}
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">
            👥 Gestión de Usuarios
          </h1>
          <p className="text-sm text-gray-600">Consulta y administra los usuarios registrados.</p>
        </header>

        {/* Tabla para escritorio */}
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
                  total={totalPaginas}
                  onChange={setPage}
                />
                <Button
                  size="sm"
                  variant="flat"
                  isDisabled={page === totalPaginas}
                  onPress={() => setPage(page + 1)}
                >
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

        {/* Modal para crear/editar usuario */}
        <Modal
          isOpen={userIsOpen}
          onOpenChange={userOnOpenChange}
          placement="center"
          className="backdrop-blur-sm bg-black/30"
          isDismissable={false}
        >
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl max-w-3xl w-full p-8">
            {() => (
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
            )}
          </ModalContent>
        </Modal>

        {/* Modales para agregar Área, Ficha y Rol */}
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
