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
  getDetalleSolicitudes,
  createDetalleSolicitud,
  updateDetalleSolicitud,
  deleteDetalleSolicitud,
} from '@/Api/detalles_solicitud';
import { getProductos } from '@/Api/Productosform';
import { getSolicitudes } from '@/Api/Solicitudes';
import DefaultLayout from '@/layouts/default';
import { PlusIcon, MoreVertical, Search as SearchIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const columns = [
  { name: 'ID', uid: 'id', sortable: true },
  { name: 'Cantidad', uid: 'cantidadSolicitada', sortable: false },
  { name: 'Observaciones', uid: 'observaciones', sortable: false },
  { name: 'Producto', uid: 'producto', sortable: false },
  { name: 'Solicitud', uid: 'solicitud', sortable: false },
  { name: 'Acciones', uid: 'actions' },
];

const INITIAL_VISIBLE_COLUMNS = [
  'id',
  'cantidadSolicitada',
  'observaciones',
  'producto',
  'solicitud',
  'actions',
];

const DetalleSolicitudesPage = () => {
  const [detalles, setDetalles] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [filterValue, setFilterValue] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: 'id', direction: 'ascending' });

  const [cantidad, setCantidad] = useState<number | undefined>(undefined);
  const [observaciones, setObservaciones] = useState('');
  const [productoSeleccionado, setProductoSeleccionado] = useState<any | null>(null);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any | null>(null);
  const [editId, setEditId] = useState<number | null>(null);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const [toastMsg, setToastMsg] = useState('');
  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const cargarDatos = async () => {
    try {
      const [det, prods, sols] = await Promise.all([
        getDetalleSolicitudes(),
        getProductos(),
        getSolicitudes(),
      ]);
      setDetalles(det);
      setProductos(prods);
      setSolicitudes(sols);
    } catch (err) {
      console.error('Error cargando datos', err);
      notify('Error cargando datos');
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar registro? No se podrá recuperar.')) return;
    try {
      await deleteDetalleSolicitud(id);
      notify(`🗑️ Registro eliminado: ID ${id}`);
      cargarDatos();
    } catch (e) {
      notify('Error eliminando registro');
    }
  };

  const guardar = async () => {
    if (!cantidad || cantidad <= 0) {
      notify('La cantidad solicitada debe ser mayor que cero');
      return;
    }
    if (!productoSeleccionado) {
      notify('Debes seleccionar un producto');
      return;
    }
    if (!solicitudSeleccionada) {
      notify('Debes seleccionar una solicitud');
      return;
    }

    const payload = {
      cantidadSolicitada: cantidad,
      observaciones: observaciones || null,
      idProducto: {
        id: productoSeleccionado.id,
        nombre: productoSeleccionado.nombre,
      },
      idSolicitud: {
        id: solicitudSeleccionada.id,
      },
    };

    try {
      if (editId) {
        await updateDetalleSolicitud(editId, payload);
        notify('✅ Detalle actualizado');
      } else {
        await createDetalleSolicitud(payload);
        notify('✅ Detalle creado');
      }
      onClose();
      limpiarFormulario();
      cargarDatos();
    } catch {
      notify('Error guardando registro');
    }
  };

  const abrirModalEditar = (detalle: any) => {
    setEditId(detalle.id);
    setCantidad(detalle.cantidadSolicitada);
    setObservaciones(detalle.observaciones || '');
    setProductoSeleccionado(detalle.idProducto);
    setSolicitudSeleccionada(detalle.idSolicitud);
    onOpen();
  };

  const limpiarFormulario = () => {
    setEditId(null);
    setCantidad(undefined);
    setObservaciones('');
    setProductoSeleccionado(null);
    setSolicitudSeleccionada(null);
  };

  const filtered = useMemo(() => {
    return filterValue
      ? detalles.filter((d) =>
          `${d.cantidadSolicitada} ${d.observaciones || ''} ${d.idProducto?.nombre || ''} ${d.idSolicitud?.estadoSolicitud || ''}`
            .toLowerCase()
            .includes(filterValue.toLowerCase())
        )
      : detalles;
  }, [detalles, filterValue]);

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

  const renderCell = (item: any, columnKey: string) => {
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
              <Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]">
                <MoreVertical />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem onPress={() => abrirModalEditar(item)} key={`editar-${item.id}`}>
                Editar
              </DropdownItem>
              <DropdownItem onPress={() => eliminar(item.id)} key={`eliminar-${item.id}`}>
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

  const topContent = (
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
      {toastMsg && <Toast message={toastMsg} />}
      <div className="p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">
            📝 Detalle de Solicitudes
          </h1>
          <p className="text-sm text-gray-600">Gestiona los ítems de cada solicitud.</p>
        </header>

        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla detalle solicitud"
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
                <TableColumn key={col.uid} align={col.uid === 'actions' ? 'center' : 'start'} width={col.uid === 'observaciones' ? 300 : undefined}>
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={sorted} emptyContent="No se encontraron registros">
              {(item) => <TableRow key={item.id}>{(col) => <TableCell>{renderCell(item, col as string)}</TableCell>}</TableRow>}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-4 md:hidden">
          {sorted.length === 0 && (
            <p className="text-center text-gray-500">No se encontraron registros</p>
          )}
          {sorted.map((detalle) => (
            <Card key={detalle.id} className="shadow-sm">
              <CardContent className="space-y-2 p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">Cant: {detalle.cantidadSolicitada}</h3>
                  <Dropdown>
                    <DropdownTrigger>
                      <Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]">
                        <MoreVertical />
                      </Button>
                    </DropdownTrigger>
                    <DropdownMenu>
                      <DropdownItem onPress={() => abrirModalEditar(detalle)} key={`editar-${detalle.id}`}>
                        Editar
                      </DropdownItem>
                      <DropdownItem onPress={() => eliminar(detalle.id)} key={`eliminar-${detalle.id}`}>
                        Eliminar
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
                <p className="text-sm text-gray-600 break-words">
                  <span className="font-medium">Observaciones:</span> {detalle.observaciones || '—'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Producto:</span> {detalle.idProducto?.nombre || '—'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Solicitud:</span> {detalle.idSolicitud?.estadoSolicitud || '—'}
                </p>
                <p className="text-xs text-gray-400">ID: {detalle.id}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Modal
          isOpen={isOpen}
          onOpenChange={onClose}
          placement="center"
          className="backdrop-blur-sm bg-black/30"
          isDismissable={false}
        >
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl">
            <>
              <ModalHeader>{editId ? 'Editar Detalle' : 'Nuevo Detalle'}</ModalHeader>
              <ModalBody className="space-y-4">
                <Input
                  label="Cantidad solicitada"
                  placeholder="Ej: 10"
                  type="number"
                  value={typeof cantidad === 'number' ? cantidad.toString() : ''}
                  onValueChange={(v) => setCantidad(v ? Number(v) : undefined)}
                  radius="sm"
                />
                <Input
                  label="Observaciones"
                  placeholder="Observaciones (opcional)"
                  value={observaciones}
                  onValueChange={setObservaciones}
                  radius="sm"
                />
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Producto
                  </label>
                  <select
                    value={productoSeleccionado?.id || ''}
                    onChange={(event) => {
                      const id = Number(event.target.value);
                      const producto = productos.find((p) => p.id === id) ?? null;
                      setProductoSeleccionado(producto);
                    }}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione un producto</option>
                    {productos.map((producto) => (
                      <option key={producto.id} value={producto.id}>
                        {producto.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    Solicitud
                  </label>
                  <select
                    value={solicitudSeleccionada?.id || ''}
                    onChange={(event) => {
                      const id = Number(event.target.value);
                      const solicitud = solicitudes.find((s) => s.id === id) ?? null;
                      setSolicitudSeleccionada(solicitud);
                    }}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Seleccione una solicitud</option>
                    {solicitudes.map((solicitud) => (
                      <option key={solicitud.id} value={solicitud.id}>
                        {`${solicitud.id} - ${solicitud.estadoSolicitud}`}
                      </option>
                    ))}
                  </select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cancelar
                </Button>
                <Button variant="flat" onPress={guardar}>
                  {editId ? 'Actualizar' : 'Crear'}
                </Button>
              </ModalFooter>
            </>
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
};

export default DetalleSolicitudesPage;
