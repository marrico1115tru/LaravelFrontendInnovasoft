import { useEffect, useMemo, useState } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Input, Button, Dropdown, DropdownMenu, DropdownItem, DropdownTrigger,
  Pagination, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
  Checkbox, useDisclosure, type SortDescriptor,
} from '@heroui/react';
import {
  obtenerMunicipios, crearMunicipio, actualizarMunicipio, eliminarMunicipio,
} from '@/Api/MunicipiosForm';
import { getPermisosPorRuta } from '@/Api/getPermisosPorRuta/PermisosService';
import DefaultLayout from '@/layouts/default';
import { PlusIcon, MoreVertical, Search as SearchIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const ID_ROL_ACTUAL = 1;

const Toast = ({ message }: { message: string }) => (
  <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50">
    {message}
  </div>
);

const columns = [
  { name: 'ID', uid: 'id', sortable: true },
  { name: 'Nombre', uid: 'nombre', sortable: false },
  { name: 'Departamento', uid: 'departamento', sortable: false },
  { name: 'Centros', uid: 'centros', sortable: false },
  { name: 'Acciones', uid: 'actions' },
];
const INITIAL_VISIBLE_COLUMNS = ['id', 'nombre', 'departamento', 'centros', 'actions'];

const MunicipiosPage = () => {
  const [permisos, setPermisos] = useState({
    puedeVer: false,
    puedeCrear: false,
    puedeEditar: false,
    puedeEliminar: false,
  });

  const [municipios, setMunicipios] = useState<any[]>([]);
  const [filterValue, setFilterValue] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'id',
    direction: 'ascending',
  });

  const [nombre, setNombre] = useState('');
  const [departamento, setDepartamento] = useState('');
  const [editId, setEditId] = useState<number | null>(null);

  const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure();
  const [toastMsg, setToastMsg] = useState('');
  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    cargarPermisos();
    // eslint-disable-next-line
  }, []);

  // 👇 CORREGIDO: usa permisosObtenidos DIRECTAMENTE
  const cargarPermisos = async () => {
    try {
      const permisosObtenidos = await getPermisosPorRuta('/MunicipioPage', ID_ROL_ACTUAL);
      console.log('Permisos recibidos:', permisosObtenidos);
      setPermisos(permisosObtenidos);
      if (permisosObtenidos.puedeVer) {
        cargarMunicipios();
      }
    } catch (error) {
      console.error('Error cargando permisos:', error);
      setPermisos({
        puedeVer: false,
        puedeCrear: false,
        puedeEditar: false,
        puedeEliminar: false,
      });
    }
  };

  const cargarMunicipios = async () => {
    try {
      const data = await obtenerMunicipios();
      setMunicipios(data);
    } catch (err) {
      console.error('Error cargando municipios', err);
    }
  };

  const eliminar = async (id: number) => {
    if (!permisos.puedeEliminar) return;
    if (!window.confirm('¿Eliminar municipio? No se podrá recuperar.')) return;
    await eliminarMunicipio(id);
    notify(`🗑️ Municipio eliminado: ID ${id}`);
    cargarMunicipios();
  };

  const guardar = async () => {
    if (editId && !permisos.puedeEditar) return;
    if (!editId && !permisos.puedeCrear) return;
    const payload = { nombre, departamento };
    if (editId) {
      await actualizarMunicipio(editId, payload);
      notify('✏️ Municipio actualizado');
    } else {
      await crearMunicipio(payload);
      notify('✅ Municipio creado');
    }
    limpiarForm();
    onClose();
    cargarMunicipios();
  };

  const abrirModalEditar = (m: any) => {
    if (!permisos.puedeEditar) return;
    setEditId(m.id);
    setNombre(m.nombre || '');
    setDepartamento(m.departamento || '');
    onOpen();
  };

  const limpiarForm = () => {
    setEditId(null);
    setNombre('');
    setDepartamento('');
  };

  const filtered = useMemo(() => {
    if (!filterValue) return municipios;
    return municipios.filter((m) =>
      `${m.nombre} ${m.departamento}`.toLowerCase().includes(filterValue.toLowerCase())
    );
  }, [municipios, filterValue]);

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
      case 'nombre':
        return (
          <span className="font-medium text-gray-800 capitalize break-words max-w-[16rem]">
            {item.nombre}
          </span>
        );
      case 'departamento':
        return <span className="text-sm text-gray-600">{item.departamento}</span>;
      case 'centros':
        return <span className="text-sm text-gray-600">{item.centroFormacions?.length || 0}</span>;
      case 'actions':
        if (!permisos.puedeEditar && !permisos.puedeEliminar) return null;
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]">
                <MoreVertical />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              {[
                permisos.puedeEditar ? (
                  <DropdownItem key={`editar-${item.id}`} onPress={() => abrirModalEditar(item)}>
                    Editar
                  </DropdownItem>
                ) : null,
                permisos.puedeEliminar ? (
                  <DropdownItem key={`eliminar-${item.id}`} onPress={() => eliminar(item.id)}>
                    Eliminar
                  </DropdownItem>
                ) : null,
              ].filter(Boolean)}
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

  if (!permisos.puedeVer) {
    return (
      <DefaultLayout>
        <div className="p-6">
          <div className="bg-red-100 text-red-700 p-4 rounded shadow text-center">
            No tienes permiso para ver esta página.
          </div>
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
          placeholder="Buscar por nombre o departamento"
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
          {permisos.puedeCrear && (
            <Button
              className="bg-[#0D1324] hover:bg-[#1a2133] text-white font-medium rounded-lg shadow"
              endContent={<PlusIcon />}
              onPress={() => {
                limpiarForm();
                onOpen();
              }}
            >
              Nuevo Municipio
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-default-400 text-sm">Total {municipios.length} municipios</span>
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
            🗺️ Gestión de Municipios
          </h1>
          <p className="text-sm text-gray-600">
            Consulta y administra los municipios registrados.
          </p>
        </header>

        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de municipios"
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
                <TableColumn key={col.uid} align={col.uid === 'actions' ? 'center' : 'start'}>
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={sorted} emptyContent="No se encontraron municipios">
              {(item) => (
                <TableRow key={item.id}>
                  {(col) => <TableCell>{renderCell(item, String(col))}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="grid gap-4 md:hidden">
          {sorted.length === 0 && (
            <p className="text-center text-gray-500">No se encontraron municipios</p>
          )}
          {sorted.map((m) => (
            <Card key={m.id} className="shadow-sm">
              <CardContent className="space-y-2 p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg">{m.nombre}</h3>
                  {(permisos.puedeEditar || permisos.puedeEliminar) && (
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
                        {[
                          permisos.puedeEditar ? (
                            <DropdownItem key={`editar-${m.id}`} onPress={() => abrirModalEditar(m)}>
                              Editar
                            </DropdownItem>
                          ) : null,
                          permisos.puedeEliminar ? (
                            <DropdownItem key={`eliminar-${m.id}`} onPress={() => eliminar(m.id)}>
                              Eliminar
                            </DropdownItem>
                          ) : null,
                        ].filter(Boolean)}
                      </DropdownMenu>
                    </Dropdown>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Depto:</span> {m.departamento}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Centros:</span> {m.centroFormacions?.length || 0}
                </p>
                <p className="text-xs text-gray-400">ID: {m.id}</p>
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
                <ModalHeader>{editId ? 'Editar Municipio' : 'Nuevo Municipio'}</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input
                    label="Nombre"
                    placeholder="Ej: Neiva"
                    value={nombre}
                    onValueChange={setNombre}
                    radius="sm"
                    disabled={!permisos.puedeCrear && !editId}
                  />
                  <Input
                    label="Departamento"
                    placeholder="Ej: Huila"
                    value={departamento}
                    onValueChange={setDepartamento}
                    radius="sm"
                    disabled={!permisos.puedeCrear && !editId}
                  />
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onCloseLocal}>
                    Cancelar
                  </Button>
                  <Button
                    variant="flat"
                    onPress={guardar}
                    isDisabled={editId ? !permisos.puedeEditar : !permisos.puedeCrear}
                  >
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

export default MunicipiosPage;
