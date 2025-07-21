import { useEffect, useMemo, useState } from 'react';
import {
  Table, TableHeader, TableColumn, TableBody, TableRow, TableCell,
  Input, Button, Dropdown, DropdownMenu, DropdownItem, DropdownTrigger,
  Pagination, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader,
  Checkbox, useDisclosure, type SortDescriptor,
} from '@heroui/react';
import {
  getRoles, createRol, updateRol, deleteRol,
} from '@/Api/RolService';
import DefaultLayout from '@/layouts/default';
import { PlusIcon, MoreVertical, Search as SearchIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const Toast = ({ message }: { message: string }) => (
  <div className="fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50">
    {message}
  </div>
);

// ❌ Quitamos usuarios y permisos
const columns = [
  { name: 'ID', uid: 'id', sortable: true },
  { name: 'Rol', uid: 'rol', sortable: false },
  { name: 'Acciones', uid: 'actions' },
];
const INITIAL_VISIBLE_COLUMNS = ['id', 'rol', 'actions'];

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
  const [toastMsg, setToastMsg] = useState('');
  const notify = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  };

  useEffect(() => {
    cargarRoles();
  }, []);

  const cargarRoles = async () => {
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      console.error('Error cargando roles', err);
    }
  };

  const eliminar = async (id: number) => {
    if (!window.confirm('¿Eliminar rol? No se podrá recuperar.')) return;
    await deleteRol(id);
    notify(`🗑️ Rol eliminado: ID ${id}`);
    cargarRoles();
  };

  const guardar = async () => {
    if (!nombreRol.trim()) {
      notify('El nombre del rol es obligatorio');
      return;
    }
    const payload = { nombreRol };
    try {
      if (editId) {
        await updateRol(editId, payload);
        notify('✏️ Rol actualizado');
      } else {
        await createRol(payload);
        notify('✅ Rol creado');
      }
      limpiarForm();
      onClose();
      cargarRoles();
    } catch (error) {
      notify('Error guardando rol');
      console.error(error);
    }
  };

  const abrirModalEditar = (r: any) => {
    setEditId(r.id);
    setNombreRol(r.nombreRol);
    onOpen();
  };

  const limpiarForm = () => {
    setEditId(null);
    setNombreRol('');
  };

  const filtered = useMemo(() => {
    if (!filterValue) return roles;
    return roles.filter((r) =>
      `${r.nombreRol}`.toLowerCase().includes(filterValue.toLowerCase())
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

  const renderCell = (item: any, columnKey: string) => {
    switch (columnKey) {
      case 'rol':
        return (
          <span className="font-medium text-gray-800 break-words max-w-[18rem]">
            {item.nombreRol}
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
              <DropdownItem key={`editar-${item.id}`} onPress={() => abrirModalEditar(item)}>
                Editar
              </DropdownItem>
              <DropdownItem key={`eliminar-${item.id}`} onPress={() => eliminar(item.id)}>
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
          placeholder="Buscar por nombre de rol"
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
              limpiarForm();
              onOpen();
            }}
          >
            Nuevo Rol
          </Button>
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
            🛡️ Gestión de Roles
          </h1>
          <p className="text-sm text-gray-600">Consulta y administra los roles.</p>
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

        {/* Cards móvil */}
        <div className="grid gap-4 md:hidden">
          {sorted.length === 0 && (
            <p className="text-center text-gray-500">No se encontraron roles</p>
          )}
          {sorted.map((r) => (
            <Card key={r.id} className="shadow-sm">
              <CardContent className="space-y-2 p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-lg break-words max-w-[14rem]">
                    {r.nombreRol}
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
                      <DropdownItem key={`editar-${r.id}`} onPress={() => abrirModalEditar(r)}>
                        Editar
                      </DropdownItem>
                      <DropdownItem key={`eliminar-${r.id}`} onPress={() => eliminar(r.id)}>
                        Eliminar
                      </DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
                <p className="text-xs text-gray-400">ID: {r.id}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal CRUD */}
        <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
          <ModalContent className="backdrop-blur bg-white/60 shadow-xl rounded-xl">
            {(onCloseLocal) => (
              <>
                <ModalHeader>{editId ? 'Editar Rol' : 'Nuevo Rol'}</ModalHeader>
                <ModalBody className="space-y-4">
                  <Input
                    label="Nombre del rol"
                    placeholder="Ej: Administrador"
                    value={nombreRol}
                    onValueChange={setNombreRol}
                    radius="sm"
                  />
                </ModalBody>
                <ModalFooter>
                  <Button variant="light" onPress={onCloseLocal}>
                    Cancelar
                  </Button>
                  <Button variant="flat" onPress={guardar}>
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

export default RolesPage;
