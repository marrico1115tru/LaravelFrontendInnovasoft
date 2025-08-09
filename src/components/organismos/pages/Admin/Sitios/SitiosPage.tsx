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
import { getTiposSitio } from '@/Api/Tipo_sitios'; // O el nombre de tu API de tipos
import DefaultLayout from '@/layouts/default';
import { PlusIcon, MoreVertical, Search as SearchIcon } from "lucide-react";
import { Card, CardContent } from '@/components/ui/card';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

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

  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [estado, setEstado] = useState<'ACTIVO' | 'INACTIVO'>('ACTIVO');
  const [idArea, setIdArea] = useState<number | ''>('');
  const [idTipo, setIdTipo] = useState<number | ''>('');
  const [editId, setEditId] = useState<number | null>(null);

  const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    cargarDatos();
  }, []);

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
      await MySwal.fire("Error", "Error cargando sitios/áreas/tipos", "error");
    }
  };

  const eliminar = async (id: number) => {
    const result = await MySwal.fire({
      title: "¿Eliminar sitio?",
      text: "No se podrá recuperar.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;
    try {
      await deleteSitio(id);
      await MySwal.fire("Eliminado", `Sitio eliminado: ID ${id}`, "success");
      cargarDatos();
    } catch (error) {
      await MySwal.fire("Error", "Error eliminando sitio", "error");
    }
  };

  const guardar = async () => {
    if (!nombre.trim()) {
      await MySwal.fire("Error", "El nombre es obligatorio", "error");
      return;
    }
    if (!ubicacion.trim()) {
      await MySwal.fire("Error", "La ubicación es obligatoria", "error");
      return;
    }
    if (!idArea) {
      await MySwal.fire("Error", "Debe seleccionar un área", "error");
      return;
    }
    if (!idTipo) {
      await MySwal.fire("Error", "Debe seleccionar un tipo de sitio", "error");
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
      if (editId) {
        await updateSitio(editId, payload);
        await MySwal.fire("Actualizado", "Sitio actualizado", "success");
      } else {
        await createSitio(payload);
        await MySwal.fire("Creado", "Sitio creado", "success");
      }
      limpiarForm();
      onClose();
      await cargarDatos();
    } catch (error) {
      await MySwal.fire("Error", "Error guardando sitio", "error");
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
    setEditId(null); setNombre(''); setUbicacion(''); setEstado('ACTIVO'); setIdArea(''); setIdTipo('');
  };

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
      return (x > y ? 1 : -1) * (direction === "ascending" ? 1 : -1);
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
      case 'estado':
        return (
          <span className={`text-sm font-medium ${item.estado === 'ACTIVO' ? 'text-green-600' : 'text-red-600'}`}>
            {item.estado}
          </span>
        );
      case 'area':
        return (
          <span className="text-sm text-gray-600">
            {item.area?.nombreArea || '—'}
          </span>
        );
      case 'tipo':
        return (
          <span className="text-sm text-gray-600">
            {item.tipo_sitio?.nombre || '—'}
          </span>
        );
      case 'inventarios':
        return (
          <span className="text-sm text-gray-600">
            {item.inventarios?.length || 0}
          </span>
        );
      case 'actions':
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]">
                <MoreVertical />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem onPress={() => abrirModalEditar(item)} key={`editar-${item.id}`}>Editar</DropdownItem>
              <DropdownItem onPress={() => eliminar(item.id)} key={`eliminar-${item.id}`}>Eliminar</DropdownItem>
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
          placeholder="Buscar por nombre, ubicación, área o tipo"
          startContent={<SearchIcon className="text-[#0D1324]" />}
          value={filterValue}
          onValueChange={setFilterValue}
          onClear={() => setFilterValue('')}
        />
        <div className="flex gap-3">
          <Button className="bg-[#0D1324] hover:bg-[#1a2133] text-white font-medium rounded-lg shadow"
            endContent={<PlusIcon />} onPress={() => { limpiarForm(); onOpen(); }}>
            Nuevo Sitio
          </Button>
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
          >
            {[5, 10, 15].map((n) => (
              <option key={n} value={n}>{n}</option>
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
                <TableColumn key={col.uid} align={col.uid === 'actions' ? 'center' : 'start'}
                  width={col.uid === 'nombre' ? 260 : undefined}>{col.name}</TableColumn>
              )}
            </TableHeader>
            <TableBody items={sorted} emptyContent="No se encontraron sitios">
              {(item) => (
                <TableRow key={item.id}>
                  {(col) => <TableCell>{renderCell(item, col as string)}</TableCell>}
                </TableRow>
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
                    <Dropdown>
                      <DropdownTrigger>
                        <Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]">
                          <MoreVertical />
                        </Button>
                      </DropdownTrigger>
                      <DropdownMenu>
                        <DropdownItem key={`editar-${s.id}`} onPress={() => abrirModalEditar(s)}>Editar</DropdownItem>
                        <DropdownItem key={`eliminar-${s.id}`} onPress={() => eliminar(s.id)}>Eliminar</DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                  <p className="text-sm text-gray-600"><span className="font-medium">Ubicación:</span> {s.ubicacion}</p>
                  <p className="text-sm text-gray-600"><span className="font-medium">Estado:</span> <span className={s.estado === "INACTIVO" ? "text-red-600" : "text-green-600"}>{s.estado}</span></p>
                  <p className="text-sm text-gray-600"><span className="font-medium">Área:</span> {s.area?.nombreArea || '—'}</p>
                  <p className="text-sm text-gray-600"><span className="font-medium">Tipo:</span> {s.tipo_sitio?.nombre || '—'}</p>
                  <p className="text-sm text-gray-600"><span className="font-medium">Inventarios:</span> {s.inventarios?.length || 0}</p>
                  <p className="text-xs text-gray-400">ID: {s.id}</p>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center" className="backdrop-blur-sm bg-black/30">
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl">
            {(onCloseLocal) => (
              <>
                <ModalHeader>{editId ? 'Editar Sitio' : 'Nuevo Sitio'}</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input label="Nombre" placeholder="Ej: Bodega Norte" value={nombre} onValueChange={setNombre} radius="sm" />
                  <Input label="Ubicación" placeholder="Descripción de la ubicación" value={ubicacion} onValueChange={setUbicacion} radius="sm" />
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
                      {areas.map((a: any) => (
                        <option key={a.id} value={a.id}>{a.nombreArea}</option>
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
                      {tipos.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.nombre}</option>
                      ))}
                    </select>
                  </div>
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onCloseLocal}>Cancelar</Button>
                  <Button variant="flat" onPress={guardar}>{editId ? 'Actualizar' : 'Crear'}</Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
}
