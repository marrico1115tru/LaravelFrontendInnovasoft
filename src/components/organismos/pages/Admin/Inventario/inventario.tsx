import { useEffect, useMemo, useState } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Input, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem,
  Pagination, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
  Checkbox, Select, SelectItem, useDisclosure, type SortDescriptor,
} from '@heroui/react';

import {
  getInventarios, createInventario, updateInventario, deleteInventario,
} from '@/Api/inventario';
import { getProductos, createProducto } from '@/Api/Productosform';
import { getSitios, createSitio } from '@/Api/SitioService';
import { getCategoriasProductos } from '@/Api/Categorias';
import { getAreas } from '@/Api/AreasService';
import { getTiposSitio } from '@/Api/Tipo_sitios';

import DefaultLayout from '@/layouts/default';
import { PlusIcon, MoreVertical, Search as SearchIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

import type { InventarioFormValues } from '@/types/types/inventario';
import type { ProductoFormValues } from '@/types/types/typesProductos';
import type { SitioFormValues } from '@/types/types/Sitio';

const primaryBtn =
  'bg-[#0D1324] hover:bg-[#1a2133] text-white font-medium rounded-lg shadow';

const Toast = ({ message }: { message: string }) => (
  <div className="fixed bottom-4 right-4 z-50 rounded bg-green-600 px-4 py-2 text-white shadow">
    {message}
  </div>
);

const columns = [
  { name: 'ID', uid: 'id', sortable: true },
  { name: 'Producto', uid: 'producto' },
  { name: 'Sitio', uid: 'sitio' },
  { name: 'Stock', uid: 'stock', sortable: true },
  { name: 'Acciones', uid: 'actions' },
] as const;

type ColumnKey = (typeof columns)[number]['uid'];
const DEFAULT_VISIBLE = new Set<ColumnKey>([
  'id',
  'producto',
  'sitio',
  'stock',
  'actions',
]);

export default function InventarioPage() {
  const [inventarios, setInventarios] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [sitios, setSitios] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [tiposSitio, setTipos] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);

  const [filter, setFilter] = useState('');
  const [visible, setVisible] = useState(DEFAULT_VISIBLE);
  const [rows, setRows] = useState(5);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortDescriptor>({
    column: 'id',
    direction: 'ascending',
  });

  const [inv, setInv] = useState({
    stock: '',
    idProductoId: '',
    fkSitioId: '',
  });
  const [invId, setInvId] = useState<number | null>(null);
  const invModal = useDisclosure();

  const [prod, setProd] = useState({ nombre: '', descripcion: '', idCategoriaId: '' });
  const prodModal = useDisclosure();

  const [sit, setSit] = useState({
    nombre: '',
    ubicacion: '',
    idAreaId: '',
    idTipoSitioId: '',
  });
  const sitModal = useDisclosure();

  const [toastMsg, setToastMsg] = useState('');
  const notify = (message: string) => {
    setToastMsg(message);
    setTimeout(() => setToastMsg(''), 3000);
  };

  const cargarDatos = async () => {
    try {
      const [invD, prodD, sitD, catD, areaD, tipoD] = await Promise.all([
        getInventarios(),
        getProductos(),
        getSitios(),
        getCategoriasProductos(),
        getAreas(),
        getTiposSitio(),
      ]);
      setInventarios(Array.isArray(invD) ? invD : []);
      setProductos(Array.isArray(prodD) ? prodD : []);
      setSitios(Array.isArray(sitD) ? sitD : []);
      setCategorias(Array.isArray(catD) ? catD : []);
      setAreas(Array.isArray(areaD) ? areaD : []);
      setTipos(Array.isArray(tipoD) ? tipoD : []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      notify('Error cargando datos');
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const saveInv = async () => {
    if (!inv.stock || !inv.idProductoId || !inv.fkSitioId) {
      notify('Completa todos los campos');
      return;
    }
    const payload: InventarioFormValues = {
      stock: Number(inv.stock),
      idProductoId: +inv.idProductoId,
      fkSitioId: +inv.fkSitioId,
    };
    try {
      if (invId) {
        await updateInventario(invId, payload);
        notify('Inventario actualizado');
      } else {
        await createInventario(payload);
        notify('Inventario creado');
      }
      invModal.onClose();
      setInv({ stock: '', idProductoId: '', fkSitioId: '' });
      setInvId(null);
      setInventarios(await getInventarios());
    } catch {
      notify('Error al guardar inventario');
    }
  };

  const delInv = async (id: number) => {
    if (!confirm('¿Eliminar registro?')) return;
    try {
      await deleteInventario(id);
      notify('Inventario eliminado');
      setInventarios(await getInventarios());
    } catch {
      notify('Error al eliminar inventario');
    }
  };

  const saveProd = async () => {
    if (!prod.nombre || !prod.idCategoriaId) {
      notify('Nombre y categoría requeridos');
      return;
    }
    const payload: ProductoFormValues = {
      nombre: prod.nombre,
      descripcion: prod.descripcion || null,
      idCategoriaId: +prod.idCategoriaId,
    };
    try {
      const nuevo = await createProducto(payload);
      setProductos(await getProductos());
      setInv((f) => ({ ...f, idProductoId: String(nuevo.id) }));
      prodModal.onClose();
      setProd({ nombre: '', descripcion: '', idCategoriaId: '' });
      notify('Producto creado');
    } catch {
      notify('Error al crear producto');
    }
  };

  const saveSit = async () => {
    if (!sit.nombre || !sit.ubicacion || !sit.idAreaId || !sit.idTipoSitioId) {
      notify('Completa todos los campos');
      return;
    }
    const payload: SitioFormValues = {
      nombre: sit.nombre,
      ubicacion: sit.ubicacion,
      idArea: { id: +sit.idAreaId },
      idTipoSitio: { id: +sit.idTipoSitioId },
      estado: undefined,
    };
    try {
      const nuevo = await createSitio(payload);
      setSitios(await getSitios());
      setInv((f) => ({ ...f, fkSitioId: String(nuevo.id) }));
      sitModal.onClose();
      setSit({ nombre: '', ubicacion: '', idAreaId: '', idTipoSitioId: '' });
      notify('Sitio creado');
    } catch {
      notify('Error al crear sitio');
    }
  };

  const filtered = useMemo(() => {
    const list = Array.isArray(inventarios) ? inventarios : [];
    if (!filter) return list;
    return list.filter((item) =>
      `${item.producto?.nombre ?? ''} ${item.sitio?.nombre ?? ''}`
        .toLowerCase()
        .includes(filter.toLowerCase())
    );
  }, [inventarios, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rows));

  const list = useMemo(() => {
    const slice = filtered.slice((page - 1) * rows, page * rows);
    const direction = sort.direction === 'ascending' ? 1 : -1;
    return [...slice].sort((a, b) => {
      const aValue = sort.column === 'id' ? a.id_producto_inventario : a[sort.column];
      const bValue = sort.column === 'id' ? b.id_producto_inventario : b[sort.column];
      if (aValue === bValue) return 0;
      return aValue > bValue ? direction : -direction;
    });
  }, [filtered, page, rows, sort]);

  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case 'id':
        return item.id_producto_inventario ?? 'N/A';
      case 'producto':
        return item.producto?.nombre ?? '—';
      case 'sitio':
        return item.sitio?.nombre ?? '—';
      case 'stock':
        return item.stock ?? '—';
      case 'actions':
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button
                isIconOnly
                variant="light"
                size="sm"
                className="rounded-full text-[#0D1324]"
              >
                <MoreVertical />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem
                key={`editar-${item.id_producto_inventario}`}
                onPress={() => {
                  setInvId(item.id_producto_inventario ?? null);
                  setInv({
                    stock: item.stock?.toString() ?? '',
                    idProductoId: item.producto?.id?.toString() ?? '',
                    fkSitioId: item.sitio?.id?.toString() ?? '',
                  });
                  invModal.onOpen();
                }}
              >
                Editar
              </DropdownItem>
              <DropdownItem
                key={`eliminar-${item.id_producto_inventario}`}
                onPress={() => delInv(item.id_producto_inventario)}
              >
                Eliminar
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return item[columnKey as keyof typeof item];
    }
  };

  const toggleColumn = (key: ColumnKey) => {
    setVisible((prev) => {
      const newSet = new Set(prev);
      newSet.has(key) ? newSet.delete(key) : newSet.add(key);
      return newSet;
    });
  };

  const topContent = (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <Input
          radius="lg"
          isClearable
          value={filter}
          placeholder="Buscar por producto o sitio"
          startContent={<SearchIcon className="text-[#0D1324]" />}
          onValueChange={setFilter}
          onClear={() => setFilter('')}
        />
        <div className="flex gap-3">
          <Dropdown>
            <DropdownTrigger>
              <Button variant="flat">Columnas</Button>
            </DropdownTrigger>
            <DropdownMenu>
              {columns
                .filter((c) => c.uid !== 'actions')
                .map((col) => (
                  <DropdownItem key={col.uid}>
                    <Checkbox
                      size="sm"
                      isSelected={visible.has(col.uid)}
                      onValueChange={() => toggleColumn(col.uid)}
                    >
                      {col.name}
                    </Checkbox>
                  </DropdownItem>
                ))}
            </DropdownMenu>
          </Dropdown>
          <Button
            className={primaryBtn}
            endContent={<PlusIcon />}
            onPress={() => {
              setInv({ stock: '', idProductoId: '', fkSitioId: '' });
              setInvId(null);
              invModal.onOpen();
            }}
          >
            Nuevo Inventario
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-default-400 text-sm">
          Total {inventarios.length} registros
        </span>
        <label className="flex items-center text-sm text-default-400">
          Filas:&nbsp;
          <select
            className="bg-transparent outline-none text-default-600 ml-1"
            value={rows}
            onChange={(e) => {
              setRows(+e.target.value);
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

  return (
    <DefaultLayout>
      {toastMsg && <Toast message={toastMsg} />}
      <div className="p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold text-[#0D1324] flex items-center gap-2">
            📦 Gestión de Inventario
          </h1>
          <p className="text-sm text-gray-600">
            Consulta y administra stock por sitio y producto.
          </p>
        </header>

        <div className="hidden md:block rounded-xl bg-white shadow-sm overflow-x-auto">
          <Table
            aria-label="Tabla de inventario"
            isHeaderSticky
            topContent={topContent}
            bottomContent={
              <div className="flex justify-center items-center gap-2 py-2 px-2">
                <Button
                  size="sm"
                  variant="flat"
                  disabled={page === 1}
                  onPress={() => setPage((p) => p - 1)}
                >
                  Anterior
                </Button>
                <Pagination
                  isCompact
                  showControls
                  page={page}
                  total={totalPages}
                  onChange={setPage}
                />
                <Button
                  size="sm"
                  variant="flat"
                  disabled={page === totalPages}
                  onPress={() => setPage((p) => p + 1)}
                >
                  Siguiente
                </Button>
              </div>
            }
            sortDescriptor={sort}
            onSortChange={setSort}
            classNames={{
              th: 'py-3 px-4 bg-[#e8ecf4] text-[#0D1324] font-semibold text-sm',
              td: 'align-middle py-3 px-4',
            }}
          >
            <TableHeader columns={columns.filter((c) => visible.has(c.uid))}>
              {(col) => (
                <TableColumn
                  key={col.uid}
                  align={col.uid === 'actions' ? 'center' : 'start'}
                  width={col.uid === 'producto' ? 300 : undefined}
                >
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>

            <TableBody items={list} emptyContent="No se encontraron registros">
              {(item) => (
                <TableRow key={item.id_producto_inventario}>
                  {(col) => <TableCell>{renderCell(item, col as string)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="grid gap-4 md:hidden">
          {list.length === 0 && (
            <p className="text-center text-gray-500">No se encontraron registros</p>
          )}
          {list.map((item) => (
            <Card key={item.id_producto_inventario} className="shadow-sm">
              <CardContent className="space-y-2 p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg break-words max-w-[14rem]">
                    {item.producto?.nombre}
                  </h3>
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
                        key={`editar-${item.id_producto_inventario}`}
                        onPress={() => {
                          setInvId(item.id_producto_inventario);
                          setInv({
                            stock: item.stock.toString(),
                            idProductoId: item.producto?.id.toString() || '',
                            fkSitioId: item.sitio?.id.toString() || '',
                          });
                          invModal.onOpen();
                        }}
                      >
                        Editar
                      </DropdownItem>
                      <DropdownItem
                        key={`eliminar-${item.id_producto_inventario}`}
                        onPress={() => delInv(item.id_producto_inventario)}
                      >
                        Eliminar
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Sitio:</span> {item.sitio?.nombre ?? '—'}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Stock:</span> {item.stock}
                </p>
                <p className="text-xs text-gray-400">
                  ID: {item.id_producto_inventario}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modales de Inventario, Producto y Sitio */}
        <Modal
          isOpen={invModal.isOpen}
          onOpenChange={(open) => !open && invModal.onClose()}
          isDismissable={false}
          placement="center"
        >
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl">
            <ModalHeader>{invId ? 'Editar Inventario' : 'Nuevo Inventario'}</ModalHeader>
            <ModalBody className="space-y-4">
              <Input
                label="Stock"
                type="number"
                min={0}
                value={inv.stock}
                onValueChange={(v) => setInv((f) => ({ ...f, stock: v }))}
              />
              <div className="flex items-end gap-2">
                <Select
                  label="Producto"
                  className="flex-1"
                  selectedKeys={inv.idProductoId ? new Set([inv.idProductoId]) : new Set()}
                  onSelectionChange={(k) =>
                    setInv((f) => ({ ...f, idProductoId: [...k][0] as string }))
                  }
                >
                  {productos.map((p) => (
                    <SelectItem key={p.id}>{p.nombre}</SelectItem>
                  ))}
                </Select>
                <Button isIconOnly variant="flat" className={primaryBtn} onPress={prodModal.onOpen}>
                  <PlusIcon size={18} />
                </Button>
              </div>
              <div className="flex items-end gap-2">
                <Select
                  label="Sitio"
                  className="flex-1"
                  selectedKeys={inv.fkSitioId ? new Set([inv.fkSitioId]) : new Set()}
                  onSelectionChange={(k) =>
                    setInv((f) => ({ ...f, fkSitioId: [...k][0] as string }))
                  }
                >
                  {sitios.map((s) => (
                    <SelectItem key={s.id}>{s.nombre}</SelectItem>
                  ))}
                </Select>
                <Button isIconOnly variant="flat" className={primaryBtn} onPress={sitModal.onOpen}>
                  <PlusIcon size={18} />
                </Button>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={invModal.onClose}>
                Cancelar
              </Button>
              <Button variant="flat" onPress={saveInv}>
                {invId ? 'Actualizar' : 'Crear'}
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal
          isOpen={prodModal.isOpen}
          onOpenChange={(open) => !open && prodModal.onClose()}
          isDismissable={false}
          placement="center"
        >
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl">
            <ModalHeader>Nuevo Producto</ModalHeader>
            <ModalBody className="space-y-4">
              <Input
                label="Nombre"
                value={prod.nombre}
                onValueChange={(v) => setProd((p) => ({ ...p, nombre: v }))}
              />
              <Input
                label="Descripción (opcional)"
                value={prod.descripcion}
                onValueChange={(v) => setProd((p) => ({ ...p, descripcion: v }))}
              />
              <Select
                label="Categoría"
                selectedKeys={prod.idCategoriaId ? new Set([prod.idCategoriaId]) : new Set()}
                onSelectionChange={(k) =>
                  setProd((p) => ({ ...p, idCategoriaId: [...k][0] as string }))
                }
              >
                {categorias.map((c) => (
                  <SelectItem key={c.id}>{c.nombre}</SelectItem>
                ))}
              </Select>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={prodModal.onClose}>
                Cancelar
              </Button>
              <Button variant="flat" onPress={saveProd}>
                Crear
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal
          isOpen={sitModal.isOpen}
          onOpenChange={(open) => !open && sitModal.onClose()}
          isDismissable={false}
          placement="center"
        >
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl">
            <ModalHeader>Nuevo Sitio</ModalHeader>
            <ModalBody className="space-y-4">
              <Input
                label="Nombre"
                value={sit.nombre}
                onValueChange={(v) => setSit((s) => ({ ...s, nombre: v }))}
              />
              <Input
                label="Ubicación"
                value={sit.ubicacion}
                onValueChange={(v) => setSit((s) => ({ ...s, ubicacion: v }))}
              />
              <Select
                label="Área"
                selectedKeys={sit.idAreaId ? new Set([sit.idAreaId]) : new Set()}
                onSelectionChange={(k) =>
                  setSit((s) => ({ ...s, idAreaId: [...k][0] as string }))
                }
              >
                {areas.map((a) => (
                  <SelectItem key={a.id}>{a.nombreArea}</SelectItem>
                ))}
              </Select>
              <Select
                label="Tipo de Sitio"
                selectedKeys={sit.idTipoSitioId ? new Set([sit.idTipoSitioId]) : new Set()}
                onSelectionChange={(k) =>
                  setSit((s) => ({ ...s, idTipoSitioId: [...k][0] as string }))
                }
              >
                {tiposSitio.map((t) => (
                  <SelectItem key={t.id}>{t.nombre}</SelectItem>
                ))}
              </Select>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={sitModal.onClose}>
                Cancelar
              </Button>
              <Button variant="flat" onPress={saveSit}>
                Crear
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
}
