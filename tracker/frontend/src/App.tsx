import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ControllersList from './pages/ControllersList';
import ControllerDetail from './pages/ControllerDetail';
import ControllerForm from './pages/ControllerForm';
import MaintenancePage from './pages/MaintenancePage';
import PartsList from './pages/PartsList';
import Reports from './pages/Reports';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/controllers" element={<ControllersList />} />
          <Route path="/controllers/new" element={<ControllerForm />} />
          <Route path="/controllers/:id" element={<ControllerDetail />} />
          <Route path="/controllers/:id/edit" element={<ControllerForm />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/parts" element={<PartsList />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
