import { useEffect, useState, useMemo } from 'react';

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
  getAreas,
  createArea,
  updateArea,
  deleteArea,
} from '@/Api/AreasService';

import { getSedes } from '@/Api/SedesService';

import DefaultLayout from '@/layouts/default';
import { PlusIcon, MoreVertical, Search as SearchIcon } from 'lucide-react';

const Toast = ({ message }: { message: string }) => (
  <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50">
    {message}
  </div>
);

const columns = [
  { name: 'ID', uid: 'id', sortable: true },
  { name: 'Nombre Área', uid: 'nombre_area', sortable: false },
  { name: 'Sede', uid: 'sede_nombre', sortable: false },
  { name: 'Acciones', uid: 'actions' },
];

const INITIAL_VISIBLE_COLUMNS = ['id', 'nombre_area', 'sede_nombre', 'actions'];

const AreasPage = () => {
  const [areas, setAreas] = useState<any[]>([]);
  const [sedes, setSedes] = useState<any[]>([]);
  const [filterValue, setFilterValue] = useState('');
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [page, setPage] = useState(1);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({ column: 'id', direction: 'ascending' });

  const [nombreArea, setNombreArea] = useState('');
  const [idSede, setIdSede] = useState<number | ''>('');
  const [editId, setEditId] = useState<number | null>(null);

  const [toastMsg, setToastMsg] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();

  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [areasData, sedesData] = await Promise.all([getAreas(), getSedes()]);
        setAreas(Array.isArray(areasData) ? areasData : []);
        setSedes(Array.isArray(sedesData) ? sedesData : []);
      } catch (error) {
        notify('Error cargando áreas o sedes');
        console.error(error);
      }
    };
    fetchData();
  }, []);

  const cargarAreas = async () => {
    try {
      const data = await getAreas();
      setAreas(Array.isArray(data) ? data : []);
    } catch (error) {
      notify('Error al cargar áreas');
      console.error(error);
    }
  };

  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar área? No se podrá recuperar.')) return;
    try {
      await deleteArea(id);
      notify(`🗑️ Área eliminada: ID ${id}`);
      await cargarAreas();
    } catch (error) {
      notify('Error al eliminar área');
      console.error(error);
    }
  };

  const guardar = async () => {
    if (!nombreArea.trim()) {
      notify('El nombre del área es obligatorio');
      return;
    }
    if (!idSede) {
      notify('Debes seleccionar una sede');
      return;
    }
    const payload = {
      nombre_area: nombreArea,
      id_sede: idSede,
    };
    try {
      if (editId !== null) {
        await updateArea(editId, payload);
        notify('Área actualizada');
      } else {
        await createArea(payload);
        notify('Área creada');
      }
      cerrarModal();
      await cargarAreas();
    } catch (error) {
      notify('Error al guardar área');
      console.error(error);
    }
  };

  const abrirModalEditar = (area: any) => {
    setEditId(area.id);
    setNombreArea(area.nombre_area);
    setIdSede(area.id_sede);
    onOpen();
  };

  const cerrarModal = () => {
    setEditId(null);
    setNombreArea('');
    setIdSede('');
    onClose();
  };

  const filtered = useMemo(() => {
    if (!filterValue.trim()) return areas;
    return areas.filter(a =>
      a.nombre_area?.toLowerCase().includes(filterValue.toLowerCase()) ||
      a.sede?.nombre?.toLowerCase().includes(filterValue.toLowerCase())
    );
  }, [areas, filterValue]);

  const pages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));

  const sliced = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const sorted = useMemo(() => {
    const items = [...sliced];
    const { column, direction } = sortDescriptor;
    items.sort((a, b) => {
      let x = a[column];
      let y = b[column];
      if (column === 'sede_nombre') {
        x = a.sede?.nombre || '';
        y = b.sede?.nombre || '';
      }
      if (typeof x === 'string') x = x.toLowerCase();
      if (typeof y === 'string') y = y.toLowerCase();
      if (x === y) return 0;
      return (x > y ? 1 : -1) * (direction === 'ascending' ? 1 : -1);
    });
    return items;
  }, [sliced, sortDescriptor]);

  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case 'nombre_area':
        return <span className="font-medium">{item.nombre_area || '—'}</span>;
      case 'sede_nombre':
        return <span className="text-gray-600">{item.sede?.nombre || '—'}</span>;
      case 'actions':
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light" className="rounded-full text-[#0D1324]">
                <MoreVertical />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem key={`editar-${item.id}`} onPress={() => abrirModalEditar(item)}>Editar</DropdownItem>
              <DropdownItem key={`eliminar-${item.id}`} onPress={() => eliminar(item.id)}>Eliminar</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
      default:
        return item[columnKey] || '—';
    }
  };

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => {
      const copy = new Set(prev);
      if (copy.has(key)) copy.delete(key);
      else copy.add(key);
      return copy;
    });
  };

  return (
    <DefaultLayout>
      {toastMsg && <Toast message={toastMsg} />}
      <div className="p-6 space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">🏢 Gestión de Áreas</h1>
          <p className="text-sm text-gray-600">Consulta y administra las áreas disponibles.</p>
        </header>

        <div className="hidden md:block rounded-xl shadow-sm bg-white overflow-x-auto">
          <Table
            aria-label="Tabla de áreas"
            isHeaderSticky
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
            topContent={
              <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                  <Input
                    isClearable
                    className="w-full md:max-w-[44%]"
                    radius="lg"
                    placeholder="Buscar por nombre o sede"
                    startContent={<SearchIcon />}
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
                        {columns.filter(c => c.uid !== 'actions').map(col => (
                          <DropdownItem key={col.uid}>
                            <Checkbox isSelected={visibleColumns.has(col.uid)} onValueChange={() => toggleColumn(col.uid)}>
                              {col.name}
                            </Checkbox>
                          </DropdownItem>
                        ))}
                      </DropdownMenu>
                    </Dropdown>
                    <Button className="bg-[#0D1324] hover:bg-[#1a2133] text-white font-medium rounded-lg shadow" endContent={<PlusIcon />} onPress={onOpen}>
                      Nueva Área
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-default-400 text-sm">Total {areas.length} áreas</span>
                  <label className="flex items-center gap-2">
                    Filas por página:
                    <select value={rowsPerPage} onChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(1); }}>
                      {[5, 10, 15].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            }
            bottomContent={
              <div className="flex justify-center items-center gap-2 py-2 px-2">
                <Button size="sm" variant="flat" isDisabled={page === 1} onPress={() => setPage(page - 1)}>Anterior</Button>
                <Pagination isCompact showControls page={page} total={pages} onChange={setPage} />
                <Button size="sm" variant="flat" isDisabled={page === pages} onPress={() => setPage(page + 1)}>Siguiente</Button>
              </div>
            }
          >
            <TableHeader columns={columns.filter(c => visibleColumns.has(c.uid))}>
              {col => (
                <TableColumn key={col.uid} align={col.uid === 'actions' ? 'center' : 'start'} width={col.uid === 'nombre_area' ? 300 : undefined}>
                  {col.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody items={sorted} emptyContent="No se encontraron áreas">
              {item => (
                <TableRow key={item.id}>
                  {col => <TableCell>{renderCell(item, col as string)}</TableCell>}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Modal */}
        <Modal isOpen={isOpen} onOpenChange={onClose} placement="center" className="backdrop-blur-sm bg-black/30">
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl">
            <ModalHeader>{editId ? 'Editar Área' : 'Nueva Área'}</ModalHeader>
            <ModalBody>
              <Input label="Nombre área" placeholder="Ej: Área de TIC" value={nombreArea} onValueChange={setNombreArea} radius="sm" autoFocus required />
              <div>
                <label className="text-sm font-medium mb-1 block">Sede</label>
                <select className="w-full border rounded px-3 py-2" value={idSede} onChange={e => setIdSede(Number(e.target.value))} required>
                  <option value="">Seleccione una sede</option>
                  {sedes.map(sede => (
                    <option key={sede.id} value={sede.id}>{sede.nombre}</option>
                  ))}
                </select>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={cerrarModal}>Cancelar</Button>
              <Button color="primary" onPress={guardar}>{editId ? 'Actualizar' : 'Crear'}</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </div>
    </DefaultLayout>
  );
};

export default AreasPage;
