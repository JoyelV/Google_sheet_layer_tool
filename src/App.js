import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import secureLocalStorage from "react-secure-storage";
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = () => {
  const token = secureLocalStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

const PublicRoute = () => {
  const token = secureLocalStorage.getItem('token');
  return token ? <Navigate to="/admin" replace /> : <Outlet />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Login />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;