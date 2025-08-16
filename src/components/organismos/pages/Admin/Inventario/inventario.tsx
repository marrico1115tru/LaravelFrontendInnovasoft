"use client";

import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import Swal from "sweetalert2";
import {
  getInventarios,
  createInventario,
  updateInventario,
  deleteInventario,
} from "@/Api/inventario";
import { getProductos } from "@/Api/Productosform";
import { getSitios } from "@/Api/SitioService";
import { Inventario, InventarioFormValues } from "@/types/types/inventario";
import { Producto } from "@/types/types/typesProductos";
import { Sitio } from "@/types/types/Sitio";
import DefaultLayout from "@/layouts/default";
import { Accordion, AccordionItem, Button as HeroButton, Spinner } from "@heroui/react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CubeIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import api from "@/Api/api";

type Permisos = {
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
};

const fetchPermisos = async (ruta: string, idRol: number): Promise<Permisos> => {
  try {
    const { data } = await api.get("/por-ruta-rol/permisos", {
      params: { ruta, idRol },
    });
    return data.permisos;
  } catch (error) {
    console.error("Error al obtener permisos:", error);
    return {
      puede_ver: false,
      puede_crear: false,
      puede_editar: false,
      puede_eliminar: false,
    };
  }
};

export default function InventarioPage() {
  const [inventarios, setInventarios] = useState<Inventario[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [sitios, setSitios] = useState<Sitio[]>([]);
  const [filtro, setFiltro] = useState<string>("");
  const [form, setForm] = useState<InventarioFormValues>({
    idProductoId: 0,
    fkSitioId: 0,
    stock: 0,
  });
  const [editId, setEditId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permisos, setPermisos] = useState<Permisos>({
    puede_ver: false,
    puede_crear: false,
    puede_editar: false,
    puede_eliminar: false,
  });

  // Carga permisos y datos
  useEffect(() => {
    const initialize = async () => {
      try {
        const userCookie = Cookies.get("user");
        if (!userCookie)
          throw new Error(
            "No se encontró la sesión del usuario. Por favor, inicie sesión de nuevo."
          );
        const user = JSON.parse(userCookie);
        const idRol = user?.id_rol;
        if (!idRol) throw new Error("El usuario no tiene un rol válido asignado.");

        const ruta = "/InventarioPage";
        const permisosApi = await fetchPermisos(ruta, idRol);
        setPermisos(permisosApi);

        if (!permisosApi.puede_ver) {
          setError("No tienes permiso para ver este módulo.");
          setLoading(false);
          return;
        }

        await loadData();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  const loadData = async () => {
    try {
      const [inv, prod, sit] = await Promise.all([
        getInventarios(),
        getProductos(),
        getSitios(),
      ]);
      setInventarios(inv);
      setProductos(prod);
      setSitios(sit);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudieron cargar los datos",
      });
    }
  };

  const handleSubmit = async () => {
    if (!form.stock || !form.idProductoId || !form.fkSitioId) {
      Swal.fire({
        icon: "warning",
        title: "Campos incompletos",
        text: "Todos los campos son requeridos",
      });
      return;
    }
    try {
      if (editId) {
        if (!permisos.puede_editar) {
          Swal.fire(
            "Acceso denegado",
            "No tienes permiso para editar inventarios.",
            "error"
          );
          return;
        }
        await updateInventario(editId, form);
        Swal.fire("Actualizado", "Inventario actualizado con éxito", "success");
      } else {
        if (!permisos.puede_crear) {
          Swal.fire(
            "Acceso denegado",
            "No tienes permiso para crear inventarios.",
            "error"
          );
          return;
        }
        await createInventario(form);
        Swal.fire("Creado", "Inventario creado correctamente", "success");
      }
      setForm({ idProductoId: 0, fkSitioId: 0, stock: 0 });
      setEditId(null);
      await loadData();
    } catch {
      Swal.fire("Error", "No se pudo guardar el inventario", "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!permisos.puede_eliminar) {
      Swal.fire(
        "Acceso denegado",
        "No tienes permiso para eliminar inventarios.",
        "error"
      );
      return;
    }
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará el inventario.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (result.isConfirmed) {
      try {
        await deleteInventario(id);
        Swal.fire("Eliminado", "Inventario eliminado correctamente", "success");
        await loadData();
      } catch {
        Swal.fire("Error", "No se pudo eliminar el inventario", "error");
      }
    }
  };

  const handleEdit = (inv: Inventario) => {
    if (!permisos.puede_editar) {
      Swal.fire(
        "Acceso denegado",
        "No tienes permiso para editar inventarios.",
        "error"
      );
      return;
    }
    setForm({
      stock: inv.stock,
      idProductoId: inv.producto?.id || 0,
      fkSitioId: inv.sitio?.id || 0,
    });
    setEditId(inv.id_producto_inventario);
    // Abre el diálogo para editar
    document.getElementById("openDialog")?.click();
  };

  const agrupado = inventarios.reduce<Record<string, Inventario[]>>((acc, inv) => {
    const sitioNombre = inv.sitio?.nombre || "Sin sitio";
    if (!acc[sitioNombre]) acc[sitioNombre] = [];
    acc[sitioNombre].push(inv);
    return acc;
  }, {});

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
          <LockClosedIcon className="w-16 h-16 mx-auto" />
          <h1 className="text-2xl font-bold">Acceso Denegado</h1>
          <p>{error || "No tienes permiso para ver este módulo."}</p>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <CubeIcon className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold">Gestión de Inventarios</h1>
              <p className="text-muted-foreground text-sm">
                Visualiza el inventario disponible por sitio y producto.
              </p>
            </div>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <HeroButton
                color="primary"
                id="openDialog"
                className="flex items-center gap-2"
                disabled={!permisos.puede_crear && editId === null} // Solo habilita nuevo si puede crear
              >
                <PlusIcon className="w-4 h-4" />
                {editId ? "Editar Inventario" : "Nuevo Inventario"}
              </HeroButton>
            </DialogTrigger>
            <DialogContent className="backdrop-blur-sm bg-white/90 max-w-md rounded-lg p-6">
              <DialogHeader>
                <DialogTitle className="text-black text-xl mb-2">
                  {editId ? "Editar Inventario" : "Crear Inventario"}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Stock</label>
                  <input
                    type="number"
                    placeholder="Cantidad"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: Number(e.target.value) })
                    }
                    className="w-full mt-1 border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Producto</label>
                  <select
                    value={form.idProductoId}
                    onChange={(e) =>
                      setForm({ ...form, idProductoId: Number(e.target.value) })
                    }
                    className="w-full mt-1 border p-2 rounded bg-white"
                  >
                    <option value={0}>Selecciona un producto</option>
                    {productos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Sitio</label>
                  <select
                    value={form.fkSitioId}
                    onChange={(e) =>
                      setForm({ ...form, fkSitioId: Number(e.target.value) })
                    }
                    className="w-full mt-1 border p-2 rounded bg-white"
                  >
                    <option value={0}>Selecciona un sitio</option>
                    {sitios.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <DialogClose asChild>
                    <HeroButton variant="ghost">Cancelar</HeroButton>
                  </DialogClose>
                  <HeroButton color="primary" onClick={handleSubmit}>
                    {editId ? "Guardar Cambios" : "Crear"}
                  </HeroButton>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filtro */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar producto o sitio"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full px-4 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Inventario agrupado */}
        <Accordion variant="splitted">
          {Object.entries(agrupado)
            .filter(([sitio]) =>
              sitio.toLowerCase().includes(filtro.toLowerCase())
            )
            .map(([sitio, items]) => (
              <AccordionItem
                key={sitio}
                aria-label={sitio}
                title={
                  <div className="flex justify-between items-center w-full">
                    <span>{sitio}</span>
                    <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
                      {items.length} productos
                    </span>
                  </div>
                }
              >
                <Card className="mb-4">
                  <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[600px]">
                      <thead className="bg-gray-100 text-gray-700">
                        <tr>
                          <th className="text-left px-4 py-2">ID</th>
                          <th className="text-left px-4 py-2">Producto</th>
                          <th className="text-left px-4 py-2">Sitio</th>
                          <th className="text-left px-4 py-2">Stock</th>
                          <th className="text-left px-4 py-2">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((inv) => (
                          <tr key={inv.id_producto_inventario} className="border-t">
                            <td className="px-4 py-2">{inv.id_producto_inventario}</td>
                            <td className="px-4 py-2">
                              {inv.producto?.nombre || "Sin producto"}
                            </td>
                            <td className="px-4 py-2">
                              {inv.sitio?.nombre || "Sin sitio"}
                            </td>
                            <td className="px-4 py-2">{inv.stock}</td>
                            <td className="px-4 py-2">
                              <div className="flex gap-2">
                                <HeroButton
                                  size="sm"
                                  variant="ghost"
                                  disabled={!permisos.puede_editar}
                                  onClick={() => handleEdit(inv)}
                                  title={
                                    !permisos.puede_editar
                                      ? "No tienes permiso para editar"
                                      : undefined
                                  }
                                >
                                  <PencilSquareIcon className="w-4 h-4 text-blue-600" />
                                </HeroButton>
                                <HeroButton
                                  size="sm"
                                  color="danger"
                                  variant="ghost"
                                  disabled={!permisos.puede_eliminar}
                                  onClick={() =>
                                    handleDelete(inv.id_producto_inventario)
                                  }
                                  title={
                                    !permisos.puede_eliminar
                                      ? "No tienes permiso para eliminar"
                                      : undefined
                                  }
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </HeroButton>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              </AccordionItem>
            ))}
        </Accordion>
      </div>
    </DefaultLayout>
  );
}
