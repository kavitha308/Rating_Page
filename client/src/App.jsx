import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getRoleRedirectPath } from './utils/navigation';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleRoute from './components/auth/RoleRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ChangePassword from './pages/auth/ChangePassword';

// User & Profile Pages
import UserStores from './pages/user/UserStores';
import Profile from './pages/user/Profile';

// Admin Pages & Layout
import AdminLayout from './components/layout/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminStores from './pages/admin/AdminStores';
import AdminCreateStore from './pages/admin/AdminCreateStore';
import AdminEditStore from './pages/admin/AdminEditStore';

// Store Owner Pages
import OwnerDashboard from './pages/owner/OwnerDashboard';

// Root redirect handler based on current authentication state
const RootRedirect = () => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." fullScreen />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getRoleRedirectPath(user.role)} replace />;
  }

  return <Navigate to="/login" replace />;
};

// Public route helper (redirects away from login/register if already authenticated)
const PublicOnlyRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner message="Loading..." fullScreen />;
  }

  if (isAuthenticated && user) {
    return <Navigate to={getRoleRedirectPath(user.role)} replace />;
  }

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-container">
          <Navbar />
          <main className="main-content">
            <Routes>
              {/* Root redirect */}
              <Route path="/" element={<RootRedirect />} />

              {/* Public Auth Routes */}
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <Login />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <Register />
                  </PublicOnlyRoute>
                }
              />

              {/* Protected Authenticated Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/user/profile" element={<Profile />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/user/change-password" element={<ChangePassword />} />
              </Route>

              {/* Normal User Routes */}
              <Route element={<RoleRoute allowedRoles={['USER']} />}>
                <Route path="/stores" element={<UserStores />} />
                <Route path="/user/stores" element={<UserStores />} />
              </Route>

              {/* Admin Routes with dedicated Enterprise Admin Layout */}
              <Route element={<RoleRoute allowedRoles={['ADMIN']} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/users/:id" element={<AdminUserDetail />} />
                  <Route path="/admin/stores" element={<AdminStores />} />
                  <Route path="/admin/stores/create" element={<AdminCreateStore />} />
                  <Route path="/admin/stores/:id/edit" element={<AdminEditStore />} />
                  <Route path="/admin/profile" element={<Profile />} />
                </Route>
              </Route>

              {/* Store Owner Dashboard */}
              <Route element={<RoleRoute allowedRoles={['STORE_OWNER']} />}>
                <Route path="/owner/dashboard" element={<OwnerDashboard />} />
                <Route path="/owner" element={<Navigate to="/owner/dashboard" replace />} />
              </Route>

              {/* 404 Catch-All */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
