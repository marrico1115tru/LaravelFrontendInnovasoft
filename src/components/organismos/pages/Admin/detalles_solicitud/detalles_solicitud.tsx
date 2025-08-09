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
  useDisclosure,
  Checkbox,
  type SortDescriptor,
} from '@heroui/react';
import {
  getDetalleSolicitudes,
  createDetalleSolicitud,
  updateDetalleSolicitud,
  deleteDetalleSolicitud,
} from '@/Api/detalles_solicitud';
import { getProductos } from '@/Api/Productosform';
import { getSolicitudes } from '@/Api/Solicitudes';
import { getCategoriasProductos } from '@/Api/Categorias';
import { getUsuarios } from '@/Api/Usuariosform';
import axios from 'axios';
import DefaultLayout from '@/layouts/default';
import { PlusIcon, MoreVertical, Search as SearchIcon } from 'lucide-react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const columns = [
  { name: 'ID', uid: 'id', sortable: true },
  { name: 'Cantidad', uid: 'cantidadSolicitada', sortable: false },
  { name: 'Observaciones', uid: 'observaciones', sortable: false },
  { name: 'Producto', uid: 'producto', sortable: false },
  { name: 'Solicitud', uid: 'solicitud', sortable: false },
  { name: 'Acciones', uid: 'actions' },
] as const;

const INITIAL_VISIBLE_COLUMNS = [
  'id',
  'cantidadSolicitada',
  'observaciones',
  'producto',
  'solicitud',
  'actions',
] as const;

type ColumnKey = (typeof columns)[number]['uid'];

const ESTADOS_SOLICITUD = ['PENDIENTE', 'APROBADA', 'RECHAZADA'];

const DetalleSolicitudesPage = () => {
  // Datos
  const [detalles, setDetalles] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  // UI / filtros / paginación
  const [filterValue, setFilterValue] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(new Set<string>(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'id',
    direction: 'ascending',
  });

  // Form detalle
  const [cantidad, setCantidad] = useState<number | undefined>(undefined);
  const [observaciones, setObservaciones] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<any | null>(null);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure();

  // Modal nuevo producto
  const {
    isOpen: isOpenNuevoProducto,
    onOpen: onOpenNuevoProducto,
    onOpenChange: onOpenChangeNuevoProducto,
    onClose: onCloseNuevoProducto,
  } = useDisclosure();
  const [nuevoProductoNombre, setNuevoProductoNombre] = useState('');
  const [nuevoProductoDescripcion, setNuevoProductoDescripcion] = useState('');
  const [nuevoProductoFechaVencimiento, setNuevoProductoFechaVencimiento] = useState('');
  const [nuevoProductoCategoriaId, setNuevoProductoCategoriaId] = useState<string>('');

  // Modal nueva solicitud
  const {
    isOpen: isOpenNuevaSolicitud,
    onOpen: onOpenNuevaSolicitud,
    onOpenChange: onOpenChangeNuevaSolicitud,
    onClose: onCloseNuevaSolicitud,
  } = useDisclosure();
  const [nuevoEstadoSolicitud, setNuevoEstadoSolicitud] = useState(ESTADOS_SOLICITUD[0]);
  const [nuevaFechaSolicitud, setNuevaFechaSolicitud] = useState('');
  const [nuevoSolicitanteId, setNuevoSolicitanteId] = useState<string>('');

  // Alternar columnas visibles
  const toggleColumn = (uid: string) => {
    setVisibleColumns((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(uid)) {
        if (uid === 'actions') return prev;
        newSet.delete(uid);
      } else {
        newSet.add(uid);
      }
      return newSet;
    });
  };

  // Cargar datos
  const cargarDatos = async () => {
    try {
      const [det, prods, solsRaw, cats, usrs] = await Promise.all([
        getDetalleSolicitudes(),
        getProductos(),
        getSolicitudes(),
        getCategoriasProductos(),
        getUsuarios(),
      ]);

      // Mapear solicitudes para convertir estado_solicitud a estadoSolicitud camelCase
      const sols = solsRaw.map((s: any) => ({
        ...s,
        estadoSolicitud: s.estado_solicitud || s.estadoSolicitud, // Map camelCase para frontend
      }));

      setDetalles(det);
      setProductos(prods);
      setSolicitudes(sols);
      setCategorias(cats);
      setUsuarios(usrs);
    } catch (error) {
      console.error('Error cargando datos:', error);
      await MySwal.fire('Error', 'Error cargando datos', 'error');
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Funciones CRUD

  const eliminar = async (id: number) => {
    const result = await MySwal.fire({
      title: '¿Eliminar registro?',
      text: 'No se podrá recuperar.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
    });
    if (!result.isConfirmed) return;
    try {
      await deleteDetalleSolicitud(id);
      await MySwal.fire('Eliminado', `Registro eliminado: ID ${id}`, 'success');
      await cargarDatos();
    } catch (error) {
      console.error('Error eliminando:', error);
      await MySwal.fire('Error', 'Error eliminando registro', 'error');
    }
  };

  // Guardar detalle (crear o actualizar)
  const guardar = async () => {
    if (!cantidad || cantidad <= 0) {
      await MySwal.fire('Error', 'La cantidad solicitada debe ser mayor que cero', 'error');
      return;
    }
    if (!productoSeleccionado?.id) {
      await MySwal.fire('Error', 'Debes seleccionar un producto válido', 'error');
      return;
    }
    if (!solicitudSeleccionada?.id) {
      await MySwal.fire('Error', 'Debes seleccionar una solicitud válida', 'error');
      return;
    }

    // Construir payload
    const payload: any = {
      cantidadSolicitada: cantidad,
      observaciones: observaciones?.trim() || null,
      idProducto: { id: productoSeleccionado.id },
      idSolicitud: { id: solicitudSeleccionada.id },
    };

    try {
      if (editId !== null) {
        await updateDetalleSolicitud(editId, payload);
        await MySwal.fire('Éxito', 'Detalle actualizado', 'success');
      } else {
        await createDetalleSolicitud(payload);
        await MySwal.fire('Éxito', 'Detalle creado', 'success');
      }
      onClose();
      limpiarFormulario();
      await cargarDatos();
    } catch (e: any) {
      console.error('Error guardando detalle:', e);
      const msg = e?.response?.data?.message || 'Error guardando registro';
      await MySwal.fire('Error', msg, 'error');
    }
  };

  const abrirModalEditar = (item: any) => {
    setEditId(item.id);
    setCantidad(item.cantidadSolicitada);
    setObservaciones(item.observaciones || '');
    setProductoSeleccionado(item.idProducto || null);
    setSolicitudSeleccionada(item.idSolicitud || null);
    onOpen();
  };

  const limpiarFormulario = () => {
    setEditId(null);
    setCantidad(undefined);
    setObservaciones('');
    setProductoSeleccionado(null);
    setSolicitudSeleccionada(null);
  };

  // Crear producto rápido
  const crearProductoRapido = async () => {
    if (!nuevoProductoNombre.trim()) {
      await MySwal.fire('Error', 'El nombre del producto es obligatorio', 'warning');
      return;
    }
    if (!nuevoProductoCategoriaId) {
      await MySwal.fire('Error', 'Debe seleccionar una categoría', 'warning');
      return;
    }

    try {
      const productPayload = {
        nombre: nuevoProductoNombre.trim(),
        descripcion: nuevoProductoDescripcion.trim() || null,
        fechaVencimiento: nuevoProductoFechaVencimiento || null,
        categoriaId: parseInt(nuevoProductoCategoriaId),
      };

      await axios.post('http://localhost:3000/productos', productPayload, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      setNuevoProductoNombre('');
      setNuevoProductoDescripcion('');
      setNuevoProductoFechaVencimiento('');
      setNuevoProductoCategoriaId('');
      onCloseNuevoProducto();
      await cargarDatos();
      await MySwal.fire('Éxito', 'Producto creado exitosamente', 'success');
    } catch (e: any) {
      console.error('Error creando producto:', e);
      let errorMessage = 'Error creando producto.';
      if (e.response?.data?.message) errorMessage = e.response.data.message;
      else if (e.response?.data?.error) errorMessage = e.response.data.error;
      else if (e.message) errorMessage = e.message;
      await MySwal.fire('Error', errorMessage, 'error');
    }
  };

  // Crear solicitud rápida
  const crearSolicitudRapida = async () => {
    if (!nuevaFechaSolicitud) {
      await MySwal.fire('Error', 'La fecha es obligatoria', 'warning');
      return;
    }
    if (!nuevoEstadoSolicitud) {
      await MySwal.fire('Error', 'El estado de la solicitud es obligatorio', 'warning');
      return;
    }
    if (!nuevoSolicitanteId) {
      await MySwal.fire('Error', 'Debe seleccionar un solicitante', 'warning');
      return;
    }

    try {
      const solicitudPayload = {
        fechaSolicitud: nuevaFechaSolicitud,
        estadoSolicitud: nuevoEstadoSolicitud,
        idUsuarioSolicitante: parseInt(nuevoSolicitanteId),
      };

      await axios.post('http://localhost:3000/solicitudes', solicitudPayload, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      });

      setNuevaFechaSolicitud('');
      setNuevoEstadoSolicitud(ESTADOS_SOLICITUD[0]);
      setNuevoSolicitanteId('');
      onCloseNuevaSolicitud();
      await cargarDatos();
      await MySwal.fire('Éxito', 'Solicitud creada exitosamente', 'success');
    } catch (e: any) {
      console.error('Error creando solicitud:', e);
      let errorMessage = 'Error creando solicitud.';
      if (e.response?.data?.message) errorMessage = e.response.data.message;
      else if (e.response?.data?.error) errorMessage = e.response.data.error;
      else if (e.message) errorMessage = e.message;
      await MySwal.fire('Error', errorMessage, 'error');
    }
  };

  // Filtrado y paginación
  const filtered = useMemo(() => {
    return filterValue
      ? detalles.filter((d) =>
          `${d.cantidadSolicitada} ${d.observaciones || ''} ${d.idProducto?.nombre || ''} ${d.idSolicitud?.estadoSolicitud || ''}`
            .toLowerCase()
            .includes(filterValue.toLowerCase())
        )
      : detalles;
  }, [detalles, filterValue]);

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

  // Función para inicializar fecha actual en el modal
  const inicializarModalNuevaSolicitud = () => {
    const hoy = new Date();
    const fechaFormateada = hoy.toISOString().split('T')[0];
    setNuevaFechaSolicitud(fechaFormateada);
    onOpenNuevaSolicitud();
  };

  // Render celda
  const renderCell = (item: any, columnKey: ColumnKey) => {
    switch (columnKey) {
      case 'cantidadSolicitada':
        return <span className="text-sm text-gray-800">{item.cantidadSolicitada}</span>;
      case 'observaciones':
        return <span className="text-sm text-gray-600 break-words max-w-[16rem]">{item.observaciones || '—'}</span>;
      case 'producto':
        return <span className="text-sm text-gray-600">{item.idProducto?.nombre || '—'}</span>;
      case 'solicitud':
        return <span className="text-sm text-gray-600">{item.idSolicitud?.estadoSolicitud || '—'}</span>;
      case 'actions':
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]"><MoreVertical /></Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem key={`editar-${item.id}`} onPress={() => abrirModalEditar(item)}>Editar</DropdownItem>
              <DropdownItem key={`eliminar-${item.id}`} onPress={() => eliminar(item.id)} className="text-danger">Eliminar</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return item[columnKey as keyof typeof item] || '—';
    }
  };

  return (
    <DefaultLayout>
      <div className="p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">📝 Detalle de Solicitudes</h1>
          <p className="text-sm text-gray-600">Gestiona los ítems de cada solicitud.</p>
        </header>

        {/* Tabla y controles */}
        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla detalle solicitud"
            isHeaderSticky
            topContent={
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                  <Input
                    isClearable
                    className="w-full md:max-w-[44%]"
                    radius="lg"
                    placeholder="Buscar por observación, producto o estado"
                    startContent={<SearchIcon className="text-[#0D1324]" />}
                    value={filterValue}
                    onValueChange={setFilterValue}
                    onClear={() => setFilterValue('')}
                  />
                  <div className="flex gap-3 items-center">
                    <Dropdown>
                      <DropdownTrigger>
                        <Button variant="flat">Columnas</Button>
                      </DropdownTrigger>
                      <DropdownMenu aria-label="Seleccionar columnas">
                        {columns
                          .filter((c) => c.uid !== 'actions')
                          .map((col) => (
                            <DropdownItem key={col.uid} className="flex items-center gap-2">
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
                        onOpen();
                      }}
                    >
                      Nuevo Detalle
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-default-400 text-sm">Total {detalles.length} registros</span>
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
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            classNames={{ th: 'py-3 px-4 bg-[#e8ecf4] text-[#0D1324] font-semibold text-sm', td: 'align-middle py-3 px-4' }}
          >
            <TableHeader columns={columns.filter((c) => visibleColumns.has(c.uid))}>
              {(col) => (
                <TableColumn
                  key={col.uid}
                  align={col.uid === 'actions' ? 'center' : 'start'}
                  width={col.uid === 'observaciones' ? 300 : undefined}
                >
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={sorted} emptyContent="No se encontraron registros">
              {(item) => (
                <TableRow key={item.id}>
                  {(col) => <TableCell>{renderCell(item, col as ColumnKey)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modal Detalle */}
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" className="backdrop-blur-sm bg-black/30" isDismissable>
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl max-w-lg w-full p-6">
            {() => (
              <>
                <ModalHeader>{editId !== null ? 'Editar Detalle' : 'Nuevo Detalle'}</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input
                    label="Cantidad solicitada"
                    placeholder="Ej: 10"
                    type="number"
                    value={typeof cantidad === 'number' ? cantidad.toString() : ''}
                    onValueChange={(v) => setCantidad(v ? Number(v) : undefined)}
                    radius="sm"
                    autoFocus
                  />
                  <Input
                    label="Observaciones"
                    placeholder="Observaciones (opcional)"
                    value={observaciones}
                    onValueChange={setObservaciones}
                    radius="sm"
                  />

                  {/* Producto selector with plus button */}
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Producto</label>
                      <select
                        value={productoSeleccionado?.id || ''}
                        onChange={(e) => setProductoSeleccionado(productos.find((p) => p.id === Number(e.target.value)) || null)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccione un producto</option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button isIconOnly onPress={onOpenNuevoProducto} className="bg-[#1a2133] text-white">
                      <PlusIcon />
                    </Button>
                  </div>

                  {/* Solicitud selector with plus button */}
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-sm font-medium text-gray-700 mb-1 block">Solicitud</label>
                      <select
                        value={solicitudSeleccionada?.id || ''}
                        onChange={(e) => setSolicitudSeleccionada(solicitudes.find((s) => s.id === Number(e.target.value)) || null)}
                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Seleccione una solicitud</option>
                        {solicitudes.map((s) => (
                          <option key={s.id} value={s.id}>
                            {`${s.id} - ${s.estadoSolicitud || s.estado_solicitud || '—'}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Button isIconOnly onPress={inicializarModalNuevaSolicitud} className="bg-[#1a2133] text-white">
                      <PlusIcon />
                    </Button>
                  </div>
                </ModalBody>
                <ModalFooter className="flex justify-end gap-3">
                  <Button variant="light" onPress={onClose}>
                    Cancelar
                  </Button>
                  <Button color="primary" onPress={guardar}>
                    {editId !== null ? 'Actualizar' : 'Crear'}
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Modal Nuevo Producto */}
        <Modal isOpen={isOpenNuevoProducto} onOpenChange={onOpenChangeNuevoProducto} isDismissable>
          <ModalContent>
            {() => (
              <>
                <ModalHeader>Nuevo Producto</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input
                    label="Nombre"
                    autoFocus
                    placeholder="Nombre del producto"
                    value={nuevoProductoNombre}
                    onValueChange={setNuevoProductoNombre}
                  />
                  <Input
                    label="Descripción"
                    placeholder="Descripción"
                    value={nuevoProductoDescripcion}
                    onValueChange={setNuevoProductoDescripcion}
                  />
                  <Input
                    label="Fecha de Vencimiento"
                    type="date"
                    value={nuevoProductoFechaVencimiento}
                    onValueChange={setNuevoProductoFechaVencimiento}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select
                      value={nuevoProductoCategoriaId}
                      onChange={(e) => setNuevoProductoCategoriaId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Seleccione una categoría</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onCloseNuevoProducto}>
                    Cancelar
                  </Button>
                  <Button color="primary" onPress={crearProductoRapido}>
                    Crear Producto
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>

        {/* Modal Nueva Solicitud */}
        <Modal isOpen={isOpenNuevaSolicitud} onOpenChange={onOpenChangeNuevaSolicitud} isDismissable>
          <ModalContent>
            {() => (
              <>
                <ModalHeader>Nueva Solicitud</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input
                    label="Fecha de Solicitud"
                    type="date"
                    autoFocus
                    value={nuevaFechaSolicitud}
                    onValueChange={setNuevaFechaSolicitud}
                    isRequired
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                    <select
                      value={nuevoEstadoSolicitud}
                      onChange={(e) => setNuevoEstadoSolicitud(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {ESTADOS_SOLICITUD.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Solicitante</label>
                    <select
                      value={nuevoSolicitanteId}
                      onChange={(e) => setNuevoSolicitanteId(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Seleccione un solicitante</option>
                      {usuarios.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nombreCompleto || u.nombre || u.email || `Usuario ${u.id}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onCloseNuevaSolicitud}>
                    Cancelar
                  </Button>
                  <Button color="primary" onPress={crearSolicitudRapida}>
                    Crear Solicitud
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

export default DetalleSolicitudesPage;
