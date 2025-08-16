 import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Route, Routes } from "react-router-dom";

import IndexPage from "@/components/organismos/pages/index";
import Login from "./components/organismos/pages/login/login";
import InicioDash from "./components/organismos/pages/Inicio/inicioDash.tsx";
import Agropecuario from "./components/organismos/pages/Inicio/agropecuario";
import AmbientalView from "./components/organismos/pages/Inicio/ambiental";
import Gastronomia from "./components/organismos/pages/Inicio/gastronomia";
import EscuelaCafeView from "./components/organismos/pages/Inicio/EscuelaCafe";
import ViasView from "./components/organismos/pages/Inicio/vias";
import TicView from "./components/organismos/pages/Inicio/tic";
import ProductosTable from "./components/organismos/pages/productos/productosTable";
import UsersView from "./components/organismos/pages/Admin/usuarios/UsersView.tsx";
import CentrosFormaciones from "./components/organismos/pages/Admin/centrosformacion/CentrosFormacion.tsx";
import MovimientoInventarioPage from "./components/organismos/pages/Admin/Movimientoinventario/MovimientoInventarioPage.tsx";
import VistaProductos from "./components/organismos/pages/estadisticas/VistaProductos.tsx";
import UsuariosHistoria from "./components/organismos/pages/Reportes/UsuariosRep/UsuariosHistorial.tsx";
import UsuariosPorRol from "./components/organismos/pages/Reportes/UsuariosRep/UsuariosPorRol.tsx";
import VistaEstadisticasUsuarios from "./components/organismos/pages/estadisticas/VistaEstadisticasUsuarios.tsx";
import ProductosPorSitio from "./components/organismos/pages/Reportes/productosRep/ProductosPorSitio.tsx";
import VistaSitiosActivosInactivos from "./components/organismos/pages/estadisticas/VistaEstadisticasSitios.tsx"
import ProductosVencidos from "./components/organismos/pages/Reportes/productosRep/ProductosVencidos.tsx";
import ProductosVencimiento from "./components/organismos/pages/Reportes/productosRep/ProductosVencimiento.tsx";
import TituladosPage from "./components/organismos/pages/Titulados/TituladosPage.tsx";
import MunicipioPage from "./components/organismos/pages/Admin/municipios/MunicipioPage.tsx";
import AreasPage from "./components/organismos/pages/Admin/Areas/AreasPage.tsx";
import SedesPage from "./components/organismos/pages/Admin/Sedes/SedesPage.tsx";
import RolesPage from "./components/organismos/pages/Admin/Roles/RolesPage.tsx";
import FichaFormacionPage from "./components/organismos/pages/Admin/FichasFormacion/FichaFormacionPage.tsx";
import SolicitudesPage from "./components/organismos/pages/Admin/Solicitudes/SolicitudesPage.tsx";
import EntregaMaterialPage from "./components/organismos/pages/Admin/EntregaMaterial/EntregaMaterialPage.tsx";
import SitiosPage from "./components/organismos/pages/Admin/Sitios/SitiosPage.tsx";
import Tipo_sitiosPage from "./components/organismos/pages/Admin/Tipo_sitios/Tipo_sitiosPage.tsx";
import CategoriasProductosPage from "./components/organismos/pages/Admin/categorias/categorias.tsx";
import InventarioPage from "./components/organismos/pages/Admin/Inventario/inventario.tsx";
import DetalleSolicitudPage from "./components/organismos/pages/Admin/detalles_solicitud/detalles_solicitud.tsx";
/*import GetModulosConOpciones from "./components/organismos/pages/permisos/ModulosConOpcionesPage.tsx";*/
import RecuperarContraseña from "./components/organismos/pages/login/RecuperarContraseña.tsx";
const queryClient = new QueryClient();

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <Routes>
        <Route path="/InicioDash" element={<InicioDash />} />
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<IndexPage />} />
        <Route path="/agropecuario" element={<Agropecuario />} />
        <Route path="/ambiental" element={<AmbientalView />} />
        <Route path="/gastronomia" element={<Gastronomia />} />
        <Route path="/vias" element={<ViasView />} />
        <Route path="/tic" element={<TicView />} />
        <Route path="/escuelacafe" element={<EscuelaCafeView />} />
        <Route path="/usuarios" element={<UsersView />} />
        <Route path="/productos/listar" element={<ProductosTable />} />
        <Route path="/CentrosFormaciones" element={<CentrosFormaciones />} />
        <Route path="/MovimientoInventarioPage" element={<MovimientoInventarioPage />} />
        <Route path="/VistaProductos" element={<VistaProductos />} />
        <Route path="/VistaEstadisticasUsuarios" element={<VistaEstadisticasUsuarios />} />
        <Route path="/VistaEstadisticasSitios" element={<VistaSitiosActivosInactivos />} />
        <Route path="/report/productosRep/ProductosPorSitio" element={<ProductosPorSitio />} />
        <Route path="/report/productosRep/ProductosVencidos" element={<ProductosVencidos />} />
        <Route path="/report/productosRep/ProductosVencimiento" element={<ProductosVencimiento />} />
        <Route path="/report/UsuariosRep/UsuariosHistoria" element={<UsuariosHistoria />} />
        <Route path="/report/UsuariosRep/UsuariosPorRol" element={<UsuariosPorRol />} />
        <Route path="/MunicipioPage" element={<MunicipioPage />} />
        <Route path="/TituladosPage" element={<TituladosPage />} />
        <Route path="/AreasPage" element={<AreasPage />} />
        <Route path="/SedesPage" element={<SedesPage />} />
        <Route path="/RolesPage" element={<RolesPage />} />
        <Route path="/FichaFormacionPage" element={<FichaFormacionPage />} />
        <Route path="/SolicitudesPage" element={<SolicitudesPage />} />
        <Route path="/EntregaMaterialPage" element={<EntregaMaterialPage />} />
        <Route path="/SitiosPage" element={<SitiosPage />} />
        <Route path="/Tipo_sitiosPage" element={<Tipo_sitiosPage />} />
        <Route path ="/CategoriasProductosPage" element={<CategoriasProductosPage/>} />
        <Route path="/InventarioPage" element={<InventarioPage/>}/>
        <Route path="/DetalleSolicitudPage" element={<DetalleSolicitudPage/>}/> 
        <Route path="/recuperar" element={<RecuperarContraseña />} /> 
      </Routes>
    </QueryClientProvider>
  );
}

export default App;