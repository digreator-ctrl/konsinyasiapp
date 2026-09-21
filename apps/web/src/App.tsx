// ============================================================
// KonsinyasiApp — Root Application Component
// Refine configuration with all resources, routing, and providers
// ============================================================

import { Refine, Authenticated, useMenu } from "@refinedev/core";
import { RefineThemes, ThemedLayoutV2, ThemedSiderV2, ThemedTitleV2, ErrorComponent, useNotificationProvider, useThemedLayoutContext } from "@refinedev/antd";
import routerProvider, { NavigateToResource, CatchAllNavigate, DocumentTitleHandler } from "@refinedev/react-router";
import { BrowserRouter, Routes, Route, Outlet, useLocation, Link } from "react-router";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ConfigProvider, App as AntdApp, Menu, Grid } from "antd";
import idID from "antd/locale/id_ID";

// Icons (Lucide Outline)
import {
  LayoutDashboard,
  Database,
  Factory,
  Package,
  Users,
  Store,
  Archive,
  PackagePlus,
  Warehouse as WarehouseIcon,
  Truck,
  ShoppingCart,
  ArrowLeftRight,
  Handshake,
  MapPin,
  ClipboardList,
  RotateCcw,
  BarChart3,
  Settings,
  Building2,
  UserCog,
  Shield,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

// Providers
import { dataProvider } from "./providers/dataProvider";
import { authProvider } from "./providers/authProvider";
import { accessControlProvider } from "./providers/accessControlProvider";
import { i18nProvider } from "./providers/i18nProvider";

// Theme
import { antdTheme } from "./styles/theme";

// Pages
import { LoginPage } from "./pages/auth/login";
import { RegisterPage } from "./pages/auth/register";
import { DashboardPage } from "./pages/dashboard";
import { ProducerList, ProducerCreate, ProducerEdit, ProducerShow } from "./pages/producers";
import { ProductList, ProductCreate, ProductEdit, ProductShow } from "./pages/products";
import { StoreList, StoreCreate, StoreEdit, StoreShow } from "./pages/stores";
import { SalesTeamPage } from "./pages/sales-team";
import { StockEntryList, StockEntryCreate, StockEntryShow } from "./pages/stock-entries";
import { WarehousePage } from "./pages/warehouse";
import { DistributionAgentList, DistributionAgentCreate, DistributionAgentShow } from "./pages/distributions/agent";
import { DistributionSalesList, DistributionSalesCreate, DistributionSalesShow } from "./pages/distributions/sales";
import { ConsignmentList, ConsignmentCreate, ConsignmentShow } from "./pages/consignments";
import { ReturnAgentList, ReturnAgentCreate, ReturnAgentShow } from "./pages/returns/agent";
import { ReturnSalesList, ReturnSalesCreate, ReturnSalesShow } from "./pages/returns/sales";
import { StockMovementReport } from "./pages/reports/stock-movement";
import { DistributionReport } from "./pages/reports/distribution";
import { CompanySettings } from "./pages/settings/company";
import { UserList, UserCreate, UserEdit, UserShow } from "./pages/settings/users";
import { RoleList, RoleCreate, RoleEdit } from "./pages/settings/roles";

// Import Ant Design styles
import "@refinedev/antd/dist/reset.css";

function RouteListener() {
  const { siderCollapsed, setSiderCollapsed, mobileSiderOpen, setMobileSiderOpen } = useThemedLayoutContext();
  const location = useLocation();

  useEffect(() => {
    if (setSiderCollapsed) setSiderCollapsed(true);
    if (setMobileSiderOpen) setMobileSiderOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return null;
}

function CustomTitle({ collapsed }: { collapsed: boolean }) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: collapsed ? 'center' : 'flex-start', 
      width: '100%',
      padding: '0 12px',
      height: '64px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          minWidth: 32,
          width: 32,
          height: 32,
          background: "linear-gradient(135deg, #4F46E5, #14B8A6)",
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          fontWeight: 800,
          color: "white",
        }}>
          K
        </div>
        {!collapsed && (
          <span style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9', whiteSpace: 'nowrap' }}>
            KonsinyasiApp
          </span>
        )}
      </div>
    </div>
  );
}

function CustomMenu() {
  const { menuItems, selectedKey, defaultOpenKeys } = useMenu();
  const [openKeys, setOpenKeys] = useState<string[]>(defaultOpenKeys || []);

  const mapToAntdItems = (items: any[]): any[] => {
    return items.map((item) => {
      const hasChildren = item.children && item.children.length > 0;
      let content = item.label || item.name;
      
      // Use Link for leaf nodes for accessibility (open in new tab)
      if (!hasChildren && item.route) {
        content = <Link to={item.route} style={{ color: 'inherit' }}>{content}</Link>;
      }

      return {
        key: item.name,
        icon: item.icon,
        label: content,
        children: hasChildren ? mapToAntdItems(item.children) : undefined,
      };
    });
  };

  return (
    <div className="custom-menu-wrapper" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        openKeys={openKeys}
        onOpenChange={(keys) => {
          const latestOpenKey = keys.find((key) => !openKeys.includes(key));
          setOpenKeys(latestOpenKey ? [latestOpenKey] : []);
        }}
        items={mapToAntdItems(menuItems)}
        style={{ border: 'none', backgroundColor: 'transparent' }}
      />
    </div>
  );
}

function CustomSider() {
  const { siderCollapsed, setSiderCollapsed } = useThemedLayoutContext();
  const breakpoint = Grid.useBreakpoint();
  const isDesktop = breakpoint.lg; // true if >= 992px (desktop)
  
  return (
    <ThemedSiderV2
      Title={({ collapsed }) => <CustomTitle collapsed={collapsed} />}
      render={({ dashboard, logout, collapsed }) => {
        return (
        <div style={{ height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
          {/* INVISIBLE OVERLAY TO INTERCEPT CLICKS AND HOVERS WHEN COLLAPSED - DESKTOP ONLY */}
          {isDesktop && collapsed && (
            <div 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (setSiderCollapsed) setSiderCollapsed(false);
              }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 100,
                cursor: 'pointer'
              }}
              title="Klik untuk memperlebar menu"
            />
          )}
          
          {/* BACKDROP TO CLOSE SIDEBAR WHEN EXPANDED (FLOATING) - DESKTOP ONLY */}
          {isDesktop && !collapsed && typeof document !== 'undefined' && createPortal(
            <div
              onClick={() => {
                if (setSiderCollapsed) setSiderCollapsed(true);
              }}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(2px)',
                zIndex: 998,
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />,
            document.body
          )}

          {dashboard}
          <CustomMenu />
          {logout}
        </div>
      )}}
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <ConfigProvider theme={antdTheme} locale={idID}>
        <AntdApp>
          <Refine
            dataProvider={dataProvider}
            authProvider={authProvider}
            accessControlProvider={accessControlProvider}
            i18nProvider={i18nProvider}
            routerProvider={routerProvider}
            notificationProvider={useNotificationProvider}
            resources={[
              {
                name: "dashboard",
                list: "/",
                meta: {
                  label: "Dashboard",
                  icon: <LayoutDashboard size={18} />,
                },
              },
              {
                name: "master-data",
                meta: {
                  label: "Master Data",
                  icon: <Database size={18} />,
                },
              },
              {
                name: "producers",
                list: "/producers",
                create: "/producers/create",
                edit: "/producers/edit/:id",
                show: "/producers/show/:id",
                meta: {
                  label: "Data Produsen",
                  parent: "master-data",
                  icon: <Factory size={18} />,
                },
              },
              {
                name: "products",
                list: "/products",
                create: "/products/create",
                edit: "/products/edit/:id",
                show: "/products/show/:id",
                meta: {
                  label: "Data Barang",
                  parent: "master-data",
                  icon: <Package size={18} />,
                },
              },
              {
                name: "stores",
                list: "/stores",
                create: "/stores/create",
                edit: "/stores/edit/:id",
                show: "/stores/show/:id",
                meta: {
                  label: "Data Toko",
                  parent: "master-data",
                  icon: <Store size={18} />,
                },
              },
              {
                name: "sales-team",
                list: "/sales-team",
                meta: {
                  label: "Tim Sales",
                  parent: "master-data",
                  icon: <Users size={18} />,
                },
              },
              {
                name: "inventory",
                meta: {
                  label: "Stok & Inventori",
                  icon: <Archive size={18} />,
                },
              },
              {
                name: "stock-entries",
                list: "/stock-entries",
                create: "/stock-entries/create",
                show: "/stock-entries/show/:id",
                meta: {
                  label: "Penerimaan Stok",
                  parent: "inventory",
                  icon: <PackagePlus size={18} />,
                },
              },
              {
                name: "warehouse",
                list: "/warehouse",
                meta: {
                  label: "Stok Gudang",
                  parent: "inventory",
                  icon: <WarehouseIcon size={18} />,
                },
              },
              {
                name: "distribution",
                meta: {
                  label: "Distribusi Barang",
                  icon: <Truck size={18} />,
                },
              },
              {
                name: "distributions-agent",
                list: "/distributions/agent",
                create: "/distributions/agent/create",
                show: "/distributions/agent/show/:id",
                meta: {
                  label: "Penjualan Agen",
                  parent: "distribution",
                  icon: <ShoppingCart size={18} />,
                },
              },
              {
                name: "distributions-sales",
                list: "/distributions/sales",
                create: "/distributions/sales/create",
                show: "/distributions/sales/show/:id",
                meta: {
                  label: "Distribusi Sales",
                  parent: "distribution",
                  icon: <ArrowLeftRight size={18} />,
                },
              },
              {
                name: "consignments",
                list: "/consignments",
                create: "/consignments/create",
                show: "/consignments/show/:id",
                meta: {
                  label: "Konsinyasi Toko",
                  icon: <Handshake size={18} />,
                },
              },
              {
                name: "returns",
                meta: {
                  label: "Manajemen Retur",
                  icon: <RotateCcw size={18} />,
                },
              },
              {
                name: "returns-agent",
                list: "/returns/agent",
                create: "/returns/agent/create",
                show: "/returns/agent/show/:id",
                meta: {
                  label: "Retur Agen",
                  parent: "returns",
                  icon: <RotateCcw size={18} />,
                },
              },
              {
                name: "returns-sales",
                list: "/returns/sales",
                create: "/returns/sales/create",
                show: "/returns/sales/show/:id",
                meta: {
                  label: "Retur Sales/Toko",
                  parent: "returns",
                  icon: <RotateCcw size={18} />,
                },
              },
              {
                name: "reports",
                meta: {
                  label: "Laporan",
                  icon: <BarChart3 size={18} />,
                },
              },
              {
                name: "reports-stock",
                list: "/reports/stock-movement",
                meta: {
                  label: "Pergerakan Stok",
                  parent: "reports",
                  icon: <BarChart3 size={18} />,
                },
              },
              {
                name: "reports-distribution",
                list: "/reports/distribution",
                meta: {
                  label: "Distribusi & Sales",
                  parent: "reports",
                  icon: <BarChart3 size={18} />,
                },
              },
              {
                name: "settings",
                meta: {
                  label: "Pengaturan",
                  icon: <Settings size={18} />,
                },
              },
              {
                name: "settings-company",
                list: "/settings/company",
                meta: {
                  label: "Profil Usaha",
                  parent: "settings",
                  icon: <Building2 size={18} />,
                },
              },
              {
                name: "settings-users",
                list: "/settings/users",
                create: "/settings/users/create",
                edit: "/settings/users/edit/:id",
                show: "/settings/users/show/:id",
                meta: {
                  label: "Manajemen Pengguna",
                  parent: "settings",
                  icon: <UserCog size={18} />,
                },
              },
              {
                name: "settings-roles",
                list: "/settings/roles",
                create: "/settings/roles/create",
                edit: "/settings/roles/edit/:id",
                meta: {
                  label: "Peran & Hak Akses",
                  parent: "settings",
                  icon: <Shield size={18} />,
                },
              },
            ]}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
              title: {
                text: "KonsinyasiApp",
                icon: (
                  <div style={{
                    width: 28,
                    height: 28,
                    background: "linear-gradient(135deg, #4F46E5, #14B8A6)",
                    borderRadius: 7,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 800,
                    color: "white",
                  }}>
                    K
                  </div>
                ),
              },
            }}
          >
            <Routes>
              {/* Authenticated Routes */}
              <Route
                element={
                  <Authenticated key="auth-layout" fallback={<CatchAllNavigate to="/login" />}>
                    <ThemedLayoutV2
                      initialSiderCollapsed={true}
                      Sider={() => <CustomSider />}
                    >
                      <RouteListener />
                      <Outlet />
                    </ThemedLayoutV2>
                  </Authenticated>
                }
              >
                {/* Dashboard */}
                <Route index element={<DashboardPage />} />

                {/* Master Data */}
                <Route path="/producers">
                  <Route index element={<ProducerList />} />
                  <Route path="create" element={<ProducerCreate />} />
                  <Route path="edit/:id" element={<ProducerEdit />} />
                  <Route path="show/:id" element={<ProducerShow />} />
                </Route>

                <Route path="/products">
                  <Route index element={<ProductList />} />
                  <Route path="create" element={<ProductCreate />} />
                  <Route path="edit/:id" element={<ProductEdit />} />
                  <Route path="show/:id" element={<ProductShow />} />
                </Route>

                <Route path="/stores">
                  <Route index element={<StoreList />} />
                  <Route path="create" element={<StoreCreate />} />
                  <Route path="edit/:id" element={<StoreEdit />} />
                  <Route path="show/:id" element={<StoreShow />} />
                </Route>

                <Route path="/sales-team" element={<SalesTeamPage />} />

                {/* Stok & Inventori */}
                <Route path="/stock-entries">
                  <Route index element={<StockEntryList />} />
                  <Route path="create" element={<StockEntryCreate />} />
                  <Route path="show/:id" element={<StockEntryShow />} />
                </Route>

                <Route path="/warehouse" element={<WarehousePage />} />

                {/* Distribusi */}
                <Route path="/distributions/agent">
                  <Route index element={<DistributionAgentList />} />
                  <Route path="create" element={<DistributionAgentCreate />} />
                  <Route path="show/:id" element={<DistributionAgentShow />} />
                </Route>

                <Route path="/distributions/sales">
                  <Route index element={<DistributionSalesList />} />
                  <Route path="create" element={<DistributionSalesCreate />} />
                  <Route path="show/:id" element={<DistributionSalesShow />} />
                </Route>

                {/* Konsinyasi */}
                <Route path="/consignments">
                  <Route index element={<ConsignmentList />} />
                  <Route path="create" element={<ConsignmentCreate />} />
                  <Route path="show/:id" element={<ConsignmentShow />} />
                </Route>

                {/* Retur */}
                <Route path="/returns/agent">
                  <Route index element={<ReturnAgentList />} />
                  <Route path="create" element={<ReturnAgentCreate />} />
                  <Route path="show/:id" element={<ReturnAgentShow />} />
                </Route>

                <Route path="/returns/sales">
                  <Route index element={<ReturnSalesList />} />
                  <Route path="create" element={<ReturnSalesCreate />} />
                  <Route path="show/:id" element={<ReturnSalesShow />} />
                </Route>

                {/* Laporan */}
                <Route path="/reports/stock-movement" element={<StockMovementReport />} />
                <Route path="/reports/distribution" element={<DistributionReport />} />

                {/* Pengaturan */}
                <Route path="/settings/company" element={<CompanySettings />} />
                <Route path="/settings/users">
                  <Route index element={<UserList />} />
                  <Route path="show/:id" element={<UserShow />} />
                  <Route path="create" element={<UserCreate />} />
                  <Route path="edit/:id" element={<UserEdit />} />
                </Route>
                <Route path="/settings/roles">
                  <Route index element={<RoleList />} />
                  <Route path="create" element={<RoleCreate />} />
                  <Route path="edit/:id" element={<RoleEdit />} />
                </Route>

                {/* Catch-all */}
                <Route path="*" element={<ErrorComponent />} />
              </Route>

              {/* Auth Routes (Public) */}
              <Route
                element={
                  <Authenticated key="auth-pages" fallback={<Outlet />}>
                    <NavigateToResource resource="dashboard" />
                  </Authenticated>
                }
              >
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>
            </Routes>
            <DocumentTitleHandler />
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
