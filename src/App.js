import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; 
import AdminDashboard from './pages/AdminDashboard';

const ProtectedRoute = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
};

const PublicRoute = () => {
  const token = localStorage.getItem('token');
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
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;