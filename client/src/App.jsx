import { Routes, Route } from 'react-router-dom';
import EstimatorPage from './pages/EstimatorPage.jsx';
import OwnerLogin from './pages/OwnerLogin.jsx';
import OwnerDashboard from './pages/OwnerDashboard.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<EstimatorPage />} />
      <Route path="/admin/login" element={<OwnerLogin />} />
      <Route path="/admin" element={<OwnerDashboard />} />
    </Routes>
  );
}
