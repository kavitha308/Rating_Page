import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Store,
  PlusCircle,
  ShieldCheck,
  KeyRound,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Activity,
  Star,
  ExternalLink
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname === path || (path !== '/admin' && location.pathname.startsWith(`${path}/`));
  };

  const navItems = [
    {
      to: '/admin/dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      exact: true
    },
    {
      to: '/admin/users',
      label: 'User Directory',
      icon: Users,
      exact: false
    },
    {
      to: '/admin/stores',
      label: 'Store Directory',
      icon: Store,
      exact: true
    },
    {
      to: '/admin/stores/create',
      label: 'Create Store',
      icon: PlusCircle,
      exact: true
    }
  ];

  // Helper for dynamic breadcrumbs
  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/admin/dashboard') return 'Platform Overview';
    if (path === '/admin/users') return 'User Management';
    if (path.startsWith('/admin/users/')) return 'User Profile Details';
    if (path === '/admin/stores') return 'Store Directory';
    if (path === '/admin/stores/create') return 'Create Merchant Store';
    if (path === '/admin/profile') return 'Administrator Profile';
    return 'Console';
  };

  return (
    <div className="admin-layout-root">
      {/* Mobile Drawer Overlay Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* 1. Left Enterprise Sidebar */}
      <aside className={`admin-sidebar ${mobileSidebarOpen ? 'is-mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="admin-sidebar-header">
          <Link to="/admin/dashboard" className="admin-brand-link" onClick={() => setMobileSidebarOpen(false)}>
            <div className="admin-brand-icon">
              <Star size={18} fill="#fff" color="#fff" />
            </div>
            <div className="admin-brand-text">
              <span className="admin-brand-name">StoreRate</span>
              <span className="admin-brand-tag">Admin Console</span>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={() => setMobileSidebarOpen(false)}
            aria-label="Close sidebar navigation"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <div className="admin-sidebar-content">
          <div className="admin-sidebar-section-title">PLATFORM MANAGEMENT</div>
          <nav className="admin-nav-list" role="navigation" aria-label="Admin Navigation">
            {navItems.map((item) => {
              const active = isActive(item.to, item.exact);
              const ItemIcon = item.icon;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`admin-nav-item ${active ? 'is-active' : ''}`}
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-current={active ? 'page' : undefined}
                >
                  <ItemIcon size={18} className="admin-nav-icon" />
                  <span className="admin-nav-label">{item.label}</span>
                  {active && <ChevronRight size={14} className="admin-nav-arrow" />}
                </Link>
              );
            })}
          </nav>

          {/* System Health Status Indicator */}
          <div className="admin-system-box">
            <div className="admin-system-header">
              <Activity size={14} className="admin-system-pulse-icon" />
              <span>System Status</span>
            </div>
            <div className="admin-system-status">
              <span className="status-dot-pulse" />
              <span>Engine Online & Healthy</span>
            </div>
            <div className="admin-system-meta">MySQL 8.0 · REST API v1.0</div>
          </div>
        </div>

        {/* Bottom Admin User Profile Card - Links to full Profile page */}
        <div className="admin-sidebar-footer">
          <Link
            to="/admin/profile"
            className="admin-user-profile-card user-pill-clickable"
            title="Click to view administrator profile"
            style={{ textDecoration: 'none' }}
            onClick={() => setMobileSidebarOpen(false)}
          >
            <div className="admin-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="admin-user-info">
              <div className="admin-user-name" title={user?.name}>
                {user?.name || 'Administrator'}
              </div>
              <div className="admin-user-role-badge">
                <ShieldCheck size={11} />
                <span>SUPER ADMIN</span>
              </div>
            </div>
          </Link>

          <div className="admin-footer-actions">
            <Link
              to="/user/change-password"
              className="admin-footer-btn"
              title="Change Account Password"
              onClick={() => setMobileSidebarOpen(false)}
            >
              <KeyRound size={15} />
              <span>Security</span>
            </Link>

            <button
              type="button"
              className="admin-footer-btn logout"
              onClick={handleLogout}
              title="Log out of Administrator Session"
            >
              <LogOut size={15} />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. Main Admin Workspace Area */}
      <div className="admin-main-wrapper">
        {/* Top Header Bar for Admin */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            {/* Hamburger trigger on mobile/tablet */}
            <button
              type="button"
              className="admin-menu-toggle-btn"
              onClick={() => setMobileSidebarOpen(true)}
              aria-label="Open sidebar menu"
            >
              <Menu size={20} />
            </button>

            {/* Breadcrumb Navigation */}
            <div className="admin-breadcrumbs">
              <span className="breadcrumb-root">Admin</span>
              <ChevronRight size={14} className="breadcrumb-separator" />
              <span className="breadcrumb-active">{getBreadcrumb()}</span>
            </div>
          </div>

          <div className="admin-topbar-right">
            {/* Quick action button */}
            <Link to="/admin/stores/create" className="btn btn-primary btn-sm">
              <PlusCircle size={14} />
              <span className="hide-on-mobile">New Store</span>
            </Link>

            <Link to="/admin/users" className="btn btn-secondary btn-sm hide-on-mobile">
              <Users size={14} />
              <span>Users</span>
            </Link>

            <div className="admin-topbar-divider hide-on-mobile" />

            {/* Admin quick indicator */}
            <div className="admin-pill-badge hide-on-mobile">
              <span className="status-dot-green" />
              <span>Admin Workspace</span>
            </div>
          </div>
        </header>

        {/* Page Content Output */}
        <main className="admin-page-content" id="admin-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
