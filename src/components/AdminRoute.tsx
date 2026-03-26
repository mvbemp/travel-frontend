import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminRoute() {
  const { isAdmin, initializing } = useAuth();
  if (initializing) return null;
  return isAdmin ? <Outlet /> : <Navigate to="/groups" replace />;
}
