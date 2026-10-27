import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRoleRedirectPath } from '../../utils/navigation';
import {
  Star,
  KeyRound,
  LogOut,
  User as UserIcon,
  Store,
  Menu,
  X,
  LayoutDashboard,
  ShieldCheck,
  Award
} from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // If user is Admin and on an admin route, AdminLayout handles navigation (sidebar + topbar)
  if (isAuthenticated && user?.role === 'ADMIN' && location.pathname.startsWith('/admin')) {
    return null;
  }

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const getRoleBadgeConfig = (role) => {
    switch (role) {
      case 'ADMIN':
        return { className: 'badge-admin', label: 'ADMIN', icon: ShieldCheck };
      case 'STORE_OWNER':
        return { className: 'badge-owner', label: 'STORE OWNER', icon: Award };
      case 'USER':
      default:
        return { className: 'badge-user', label: 'CONSUMER', icon: UserIcon };
    }
  };

  const homePath = isAuthenticated && user ? getRoleRedirectPath(user.role) : '/login';
  const isActive = (path) => location.pathname === path || (path !== '/' && location.pathname.startsWith(`${path}/`));

  const roleConfig = user ? getRoleBadgeConfig(user.role) : null;
  const RoleIcon = roleConfig?.icon;

  return (
    <header className="navbar">
      <div className="nav-container">
        {/* Brand Logo & Main Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to={homePath} className="nav-brand" onClick={() => setMobileMenuOpen(false)}>
            <span className="brand-logo-badge">
              <Star size={18} fill="#fff" color="#fff" />
            </span>
            <span className="brand-logo-text">StoreRate</span>
          </Link>

          {/* Desktop Navigation for Normal User */}
          {isAuthenticated && user?.role === 'USER' && (
            <nav className="desktop-nav-links" role="navigation" aria-label="Consumer Navigation">
              <Link
                to="/user/stores"
                className={`nav-pill-link ${isActive('/user/stores') || isActive('/stores') ? 'active' : ''}`}
              >
                <Store size={15} />
                <span>Browse Stores</span>
              </Link>
            </nav>
          )}

          {/* Desktop Navigation for Store Owner */}
          {isAuthenticated && user?.role === 'STORE_OWNER' && (
            <nav className="desktop-nav-links" role="navigation" aria-label="Store Owner Navigation">
              <Link
                to="/owner/dashboard"
                className={`nav-pill-link ${isActive('/owner/dashboard') ? 'active' : ''}`}
              >
                <Store size={15} />
                <span>Store Dashboard</span>
              </Link>
            </nav>
          )}

          {/* Desktop Navigation for Admin (if on non-admin page like /change-password) */}
          {isAuthenticated && user?.role === 'ADMIN' && (
            <nav className="desktop-nav-links" role="navigation" aria-label="Admin Navigation">
              <Link
                to="/admin/dashboard"
                className={`nav-pill-link ${isActive('/admin/dashboard') ? 'active' : ''}`}
              >
                <LayoutDashboard size={15} />
                <span>Admin Console</span>
              </Link>
            </nav>
          )}
        </div>

        {/* Desktop User Menu */}
        <nav className="nav-user-menu desktop-user-menu" aria-label="User Account Menu">
          {isAuthenticated && user ? (
            <>
              {/* User Identity Pill - Navigates to full Profile page */}
              <Link
                to="/profile"
                className="user-pill user-pill-clickable"
                title="Click to view your account profile"
                aria-label="View user profile"
                style={{ textDecoration: 'none' }}
              >
                <div className="user-avatar-circle">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="user-pill-name" title={user.name}>
                  {user.name}
                </span>
                {roleConfig && (
                  <span className={`badge ${roleConfig.className}`}>
                    {RoleIcon && <RoleIcon size={11} style={{ marginRight: 3 }} />}
                    {roleConfig.label}
                  </span>
                )}
              </Link>

              {/* Password Action */}
              <Link
                to="/user/change-password"
                className="btn btn-secondary btn-sm"
                title="Change Account Password"
              >
                <KeyRound size={14} />
                <span>Password</span>
              </Link>

              {/* Logout Action */}
              <button
                type="button"
                className="btn btn-secondary btn-sm btn-logout"
                onClick={handleLogout}
                title="Log out of your account"
              >
                <LogOut size={14} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          className="mobile-hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="mobile-nav-drawer" role="menu">
          {isAuthenticated && user ? (
            <div className="mobile-nav-inner">
              <Link
                to="/profile"
                className="mobile-user-profile user-pill-clickable"
                onClick={() => setMobileMenuOpen(false)}
                title="Click to view your account profile"
                style={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                <div className="user-avatar-circle">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    {user.email}
                  </div>
                  {roleConfig && (
                    <div style={{ marginTop: '0.35rem' }}>
                      <span className={`badge ${roleConfig.className}`}>
                        {roleConfig.label}
                      </span>
                    </div>
                  )}
                </div>
              </Link>

              <div className="mobile-nav-links-list">
                {user.role === 'USER' && (
                  <Link
                    to="/user/stores"
                    className={`mobile-nav-item ${isActive('/user/stores') ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Store size={18} />
                    <span>Browse Stores</span>
                  </Link>
                )}

                {user.role === 'STORE_OWNER' && (
                  <Link
                    to="/owner/dashboard"
                    className={`mobile-nav-item ${isActive('/owner/dashboard') ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Store size={18} />
                    <span>Store Dashboard</span>
                  </Link>
                )}

                {user.role === 'ADMIN' && (
                  <Link
                    to="/admin/dashboard"
                    className={`mobile-nav-item ${isActive('/admin/dashboard') ? 'active' : ''}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <LayoutDashboard size={18} />
                    <span>Admin Console</span>
                  </Link>
                )}

                <Link
                  to="/profile"
                  className={`mobile-nav-item ${isActive('/profile') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <UserIcon size={18} />
                  <span>My Profile</span>
                </Link>

                <Link
                  to="/user/change-password"
                  className={`mobile-nav-item ${isActive('/user/change-password') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <KeyRound size={18} />
                  <span>Change Password</span>
                </Link>

                <button
                  type="button"
                  className="mobile-nav-item logout"
                  onClick={handleLogout}
                >
                  <LogOut size={18} />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mobile-nav-inner" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link
                to="/login"
                className="btn btn-secondary btn-block"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="btn btn-primary btn-block"
                onClick={() => setMobileMenuOpen(false)}
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
