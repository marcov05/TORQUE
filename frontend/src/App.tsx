import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute, PublicOnlyRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { DashboardPage } from './pages/DashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { CustomersPage } from './pages/customers/CustomersPage';
import { CustomerFormPage } from './pages/customers/CustomerFormPage';
import { MotorcyclesPage } from './pages/motorcycles/MotorcyclesPage';
import { MotorcycleFormPage } from './pages/motorcycles/MotorcycleFormPage';
import { ServicesPage } from './pages/services/ServicesPage';
import { ServiceFormPage } from './pages/services/ServiceFormPage';
import { OrdersPage } from './pages/orders/OrdersPage';
import { OrderFormPage } from './pages/orders/OrderFormPage';
import { OrderDetailPage } from './pages/orders/OrderDetailPage';

export function App() {
  return <Routes>
    <Route element={<PublicOnlyRoute />}>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
    </Route>
    <Route element={<ProtectedRoute />}>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/clientes" element={<CustomersPage />} />
        <Route path="/clientes/novo" element={<CustomerFormPage />} />
        <Route path="/clientes/:id/editar" element={<CustomerFormPage />} />
        <Route path="/motocicletas" element={<MotorcyclesPage />} />
        <Route path="/motocicletas/novo" element={<MotorcycleFormPage />} />
        <Route path="/motocicletas/:id/editar" element={<MotorcycleFormPage />} />
        <Route path="/servicos" element={<ServicesPage />} />
        <Route path="/servicos/novo" element={<ServiceFormPage />} />
        <Route path="/servicos/:id/editar" element={<ServiceFormPage />} />
        <Route path="/ordens-servico" element={<OrdersPage />} />
        <Route path="/ordens-servico/novo" element={<OrderFormPage />} />
        <Route path="/ordens-servico/:id" element={<OrderDetailPage />} />
        <Route path="/ordens-servico/:id/editar" element={<OrderFormPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
      </Route>
    </Route>
    <Route path="*" element={<NotFoundPage />} />
  </Routes>;
}
