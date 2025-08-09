import { useState } from "react";
import {
  HomeIcon,
  Bars3Icon,
  DocumentTextIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  UserGroupIcon,
  ChartBarSquareIcon,
  BuildingStorefrontIcon,
  BuildingOffice2Icon,
  AcademicCapIcon,
  FolderOpenIcon,
  MapPinIcon,
  BookOpenIcon,
  ShieldCheckIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  ArrowLeftOnRectangleIcon,
  CubeIcon,
  TagIcon,
  ListBulletIcon,
  CheckBadgeIcon,
  ArrowsRightLeftIcon,
  PlusCircleIcon,
  MagnifyingGlassCircleIcon,
  UsersIcon,
  Squares2X2Icon,
  ExclamationTriangleIcon,
  ClockIcon,
  Cog6ToothIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import SidebarButton from "@/components/molecula/Button";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [openMenus, setOpenMenus] = useState({
    reports: false,
    products: false,
    solicitudes: false,
    admin: false,
    ubicacion: false,
    formacion: false,
    infoReports: false,
    productReports: false,
    userReports: false
  });

  const navigate = useNavigate();
  const toggleMenu = (menu: keyof typeof openMenus) =>
    setOpenMenus(prev => ({ ...prev, [menu]: !prev[menu] }));

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <aside className={`transition-all duration-300 flex flex-col shadow-lg border-r border-slate-700 ${isOpen ? "w-64" : "w-20"} min-h-screen bg-slate-900 text-white`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        {isOpen && <h1 className="text-xl font-bold tracking-wide text-cyan-400">INNOVASOFT</h1>}
        <Button variant="ghost" className="text-white p-2" onClick={() => setIsOpen(!isOpen)}>
          <Bars3Icon className="w-6 h-6" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
        <nav className="flex flex-col gap-1 text-sm font-medium">
          <SidebarButton to="/home" icon={<HomeIcon className="w-5 h-5" />} label="Home" isOpen={isOpen} activePaths={["/home"]} />
          <SidebarButton to="/InicioDash" icon={<DocumentTextIcon className="w-5 h-5" />} label="Inicio" isOpen={isOpen} activePaths={["/InicioDash"]} />
          
          {/* Administración */}
          <>
            <SidebarButton icon={<ShieldCheckIcon className="w-5 h-5" />} label="Admin" isOpen={isOpen} onClick={() => toggleMenu("admin")} endIcon={openMenus.admin ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />} />
            {openMenus.admin && isOpen && (
              <Submenu>
                <SidebarButton to="/usuarios" icon={<UserGroupIcon className="w-5 h-5" />} label="Usuarios" isOpen={isOpen} />
                <SidebarButton to="/RolesPage" icon={<ShieldCheckIcon className="w-5 h-5" />} label="Roles" isOpen={isOpen} />
                <SidebarButton to="/getModulosConOpciones" icon={<ShieldCheckIcon className="w-5 h-5" />} label="Dar Permisos" isOpen={isOpen} />
              </Submenu>
            )}
          </>

          {/* Productos */}
          <>
            <SidebarButton icon={<DocumentTextIcon className="w-5 h-5" />} label="Productos" isOpen={isOpen} onClick={() => toggleMenu("products")} endIcon={openMenus.products ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />} />
            {openMenus.products && isOpen && (
              <Submenu>
                <SidebarButton to="/productos/listar" icon={<CubeIcon className="w-5 h-5" />} label="Ver Productos" isOpen={isOpen} />
                <SidebarButton to="/CategoriasProductosPage" icon={<TagIcon className="w-5 h-5" />} label="Categorías" isOpen={isOpen} />
                <SidebarButton to="/InventarioPage" icon={<BuildingStorefrontIcon className="w-5 h-5" />} label="Inventario" isOpen={isOpen} />
              </Submenu>
            )}
          </>

          {/* Solicitudes */}
          <>
            <SidebarButton icon={<ClipboardDocumentListIcon className="w-5 h-5" />} label="Solicitudes" isOpen={isOpen} onClick={() => toggleMenu("solicitudes")} endIcon={openMenus.solicitudes ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />} />
            {openMenus.solicitudes && isOpen && (
              <Submenu>
                <SidebarButton to="/SolicitudesPage" icon={<PlusCircleIcon className="w-5 h-5" />} label="Solicitudes" isOpen={isOpen} />
                <SidebarButton to="/DetalleSolicitudPage" icon={<ListBulletIcon className="w-5 h-5" />} label="Detalle de la Solicitud" isOpen={isOpen} />
                <SidebarButton to="/EntregaMaterialPage" icon={<CheckBadgeIcon className="w-5 h-5" />} label="Entrega de Material" isOpen={isOpen} />
                <SidebarButton to="/MovimientoInventarioPage" icon={<ArrowsRightLeftIcon className="w-5 h-5" />} label="Movimientos" isOpen={isOpen} />
              </Submenu>
            )}
          </>

          {/* Estadísticas y Reportes */}
          <>
            <SidebarButton icon={<ChartBarSquareIcon className="w-5 h-5" />} label="Estadísticas" isOpen={isOpen} onClick={() => toggleMenu("reports")} endIcon={openMenus.reports ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />} />
            {openMenus.reports && isOpen && (
              <Submenu>
                <SidebarButton to="/VistaProductos" icon={<MagnifyingGlassCircleIcon className="w-5 h-5" />} label="Productos" isOpen={isOpen} />
                <SidebarButton to="/VistaEstadisticasUsuarios" icon={<UsersIcon className="w-5 h-5" />} label="Usuarios" isOpen={isOpen} />
                <SidebarButton to="/VistaEstadisticasSitios" icon={<MapPinIcon className="w-5 h-5" />} label="Sitios" isOpen={isOpen} />
              </Submenu>
            )}
            <SidebarButton icon={<DocumentTextIcon className="w-5 h-5" />} label="Reportes" isOpen={isOpen} onClick={() => toggleMenu("infoReports")} endIcon={openMenus.infoReports ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />} />
            {openMenus.infoReports && isOpen && (
              <Submenu>
                <SidebarButton icon={<MagnifyingGlassCircleIcon className="w-5 h-5" />} label="Productos" isOpen={isOpen} onClick={() => toggleMenu("productReports")} endIcon={openMenus.productReports ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />} />
                {openMenus.productReports && (
                  <Submenu indent>
                    <SidebarButton to="/report/productosRep/ProductosPorSitio" icon={<Squares2X2Icon className="w-5 h-5" />} label="Productos por Sitio" isOpen={isOpen} />
                    <SidebarButton to="/report/productosRep/ProductosVencidos" icon={<ExclamationTriangleIcon className="w-5 h-5" />} label="Productos vencidos" isOpen={isOpen} />
                    <SidebarButton to="/report/productosRep/ProductosVencimiento" icon={<ClockIcon className="w-5 h-5" />} label="Próximos a vencer" isOpen={isOpen} />
                  </Submenu>
                )}
                <SidebarButton icon={<UserGroupIcon className="w-5 h-5" />} label="Usuarios" isOpen={isOpen} onClick={() => toggleMenu("userReports")} endIcon={openMenus.userReports ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />} />
                {openMenus.userReports && (
                  <Submenu indent>
                    <SidebarButton to="/report/UsuariosRep/UsuariosPorRol" icon={<Cog6ToothIcon className="w-5 h-5" />} label="Usuarios por rol" isOpen={isOpen} />
                    <SidebarButton to="/report/UsuariosRep/UsuariosHistoria" icon={<ArrowPathIcon className="w-5 h-5" />} label="Historial materiales utilizados" isOpen={isOpen} />
                  </Submenu>
                )}
              </Submenu>
            )}
          </>

          {/* Ubicación */}
          <>
            <SidebarButton icon={<MapPinIcon className="w-5 h-5" />} label="Ubicación" isOpen={isOpen} onClick={() => toggleMenu("ubicacion")} endIcon={openMenus.ubicacion ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />} />
            {openMenus.ubicacion && isOpen && (
              <Submenu>
                <SidebarButton to="/MunicipioPage" icon={<MapPinIcon className="w-5 h-5" />} label="Municipios" isOpen={isOpen} />
                <SidebarButton to="/SedesPage" icon={<BanknotesIcon className="w-5 h-5" />} label="Sedes" isOpen={isOpen} />
                <SidebarButton to="/SitiosPage" icon={<MapPinIcon className="w-5 h-5" />} label="Sitios" isOpen={isOpen} />
                <SidebarButton to="/Tipo_sitiosPage" icon={<MapPinIcon className="w-5 h-5" />} label="Tipo de Sitios" isOpen={isOpen} />
              </Submenu>
            )}
          </>

          {/* Formación */}
          <>
            <SidebarButton icon={<AcademicCapIcon className="w-5 h-5" />} label="Formación" isOpen={isOpen} onClick={() => toggleMenu("formacion")} endIcon={openMenus.formacion ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />} />
            {openMenus.formacion && isOpen && (
              <Submenu>
                <SidebarButton to="/CentrosFormaciones" icon={<BuildingOffice2Icon className="w-5 h-5" />} label="Centros Formación" isOpen={isOpen} />
                <SidebarButton to="/TituladosPage" icon={<AcademicCapIcon className="w-5 h-5" />} label="Titulados" isOpen={isOpen} />
                <SidebarButton to="/FichaFormacionPage" icon={<BookOpenIcon className="w-5 h-5" />} label="Fichas Formación" isOpen={isOpen} />
                <SidebarButton to="/AreasPage" icon={<FolderOpenIcon className="w-5 h-5" />} label="Áreas" isOpen={isOpen} />
              </Submenu>
            )}
          </>
        </nav>
      </div>

      <div className="p-4 border-t border-slate-700">
        <Button variant="ghost" className="w-full flex items-center gap-2 justify-start text-white hover:bg-slate-800" onClick={handleLogout}>
          <ArrowLeftOnRectangleIcon className="w-5 h-5" />
          {isOpen && <span>Cerrar sesión</span>}
        </Button>
      </div>
    </aside>
  );
};

const Submenu = ({ children, indent = false }: { children: React.ReactNode; indent?: boolean }) => (
  <div className={`mt-1 flex flex-col gap-1 border-l border-slate-700 ${indent ? "ml-6 pl-4" : "ml-4 pl-3"}`}>
    {children}
  </div>
);

export default Sidebar;
