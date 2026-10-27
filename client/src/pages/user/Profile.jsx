import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRoleRedirectPath } from '../../utils/navigation';
import StarRating from '../../components/common/StarRating';
import Button from '../../components/common/Button';
import {
  User,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  Award,
  Hash,
  Store,
  KeyRound,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Clock
} from 'lucide-react';

/**
 * Full-page User Profile Component
 * Spreads across the entire page, matching the layout and design system of the application.
 */
const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <h3>No User Profile Found</h3>
          <p>Please log in to view your account details.</p>
          <Link to="/login" className="btn btn-primary">Go to Login</Link>
        </div>
      </div>
    );
  }

  const getRoleDetails = (role) => {
    switch (role) {
      case 'ADMIN':
        return {
          label: 'SUPER ADMIN',
          badgeClass: 'badge-admin',
          icon: ShieldCheck,
          description: 'Full administrative access and management permissions across users, stores, and ratings.'
        };
      case 'STORE_OWNER':
        return {
          label: 'STORE OWNER',
          badgeClass: 'badge-owner',
          icon: Award,
          description: 'Merchant partner account. Manages assigned store profile and views customer ratings.'
        };
      case 'USER':
      default:
        return {
          label: 'CONSUMER',
          badgeClass: 'badge-user',
          icon: User,
          description: 'Standard platform rater. Can browse stores and submit or modify store ratings.'
        };
    }
  };

  const roleInfo = getRoleDetails(user.role);
  const RoleIcon = roleInfo.icon;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const backDestination = getRoleRedirectPath(user.role);

  return (
    <div className="page-container">
      {/* Top Navigation & Back Action */}
      <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={() => navigate(backDestination)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={15} /> Back to Dashboard
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link to="/user/change-password" className="btn btn-secondary btn-sm">
            <KeyRound size={14} />
            <span>Change Password</span>
          </Link>
          <Button variant="danger" size="sm" icon={LogOut} onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Page Title Header */}
      <div className="page-header" style={{ marginBottom: '1.75rem' }}>
        <div>
          <div className="brand-badge" style={{ marginBottom: '0.5rem' }}>
            <User size={14} /> My Account
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <h1 className="page-title" style={{ fontSize: '2rem', margin: 0 }}>
              {user.name}
            </h1>
            <span className={`badge ${roleInfo.badgeClass}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.85rem' }}>
              <RoleIcon size={13} style={{ marginRight: 4 }} />
              {roleInfo.label}
            </span>
          </div>
          <p className="page-subtitle" style={{ marginTop: '0.5rem' }}>
            Account identity, credentials, role permissions, and managed assets
          </p>
        </div>
      </div>

      {/* 1. Full-Width Personal Identity Card */}
      <div className="detail-card">
        <h2 className="detail-section-title">
          <User size={20} color="var(--primary)" />
          Personal & Account Information
        </h2>

        <div className="detail-grid">
          <div>
            <div className="detail-item-label">Full Name</div>
            <div className="detail-item-value" style={{ fontSize: '1.15rem' }}>
              {user.name}
            </div>
          </div>

          <div>
            <div className="detail-item-label">Email Address</div>
            <div className="detail-item-value" style={{ fontFamily: 'monospace' }}>
              {user.email}
            </div>
          </div>

          <div>
            <div className="detail-item-label">Account Role</div>
            <div className="detail-item-value" style={{ marginTop: '0.2rem' }}>
              <span className={`badge ${roleInfo.badgeClass}`}>
                <RoleIcon size={12} style={{ marginRight: 4 }} />
                {roleInfo.label}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem', lineHeight: 1.4 }}>
              {roleInfo.description}
            </div>
          </div>

          <div>
            <div className="detail-item-label">Member Since</div>
            <div className="detail-item-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={15} color="var(--text-muted)" />
              {formatDate(user.created_at)}
            </div>
          </div>

          <div>
            <div className="detail-item-label">Internal Account Reference</div>
            <div className="detail-item-value" style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
              #{user.id}
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div className="detail-item-label">Physical Home / Business Address</div>
            <div className="detail-item-value" style={{ fontWeight: 500, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <MapPin size={15} color="var(--text-muted)" style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
              {user.address || 'No physical address on file'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Store Owner Section (If role is STORE_OWNER) */}
      {user.role === 'STORE_OWNER' && (
        <div className="detail-card">
          <h2 className="detail-section-title">
            <Store size={20} color="#059669" />
            Assigned Merchant Store Profile
          </h2>

          {user.store ? (
            <div className="detail-grid">
              <div>
                <div className="detail-item-label">Store Name</div>
                <div className="detail-item-value" style={{ fontSize: '1.2rem', color: 'var(--text-main)' }}>
                  {user.store.name}
                </div>
              </div>

              <div>
                <div className="detail-item-label">Store Email</div>
                <div className="detail-item-value" style={{ fontFamily: 'monospace' }}>
                  {user.store.email}
                </div>
              </div>

              <div>
                <div className="detail-item-label">Overall Customer Rating</div>
                <div className="detail-item-value" style={{ marginTop: '0.35rem' }}>
                  <StarRating
                    rating={user.store.average_rating || 0}
                    count={user.store.total_ratings || 0}
                    size={18}
                  />
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <div className="detail-item-label">Store Physical Address</div>
                <div className="detail-item-value" style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>
                  <MapPin size={15} color="var(--text-muted)" style={{ display: 'inline', marginRight: 6, verticalAlign: 'text-bottom' }} />
                  {user.store.address}
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                <Link to="/owner/dashboard" className="btn btn-primary btn-sm">
                  <Store size={14} /> Go to Store Owner Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              No merchant store is currently assigned to this account. An administrator can assign a store to your account from the Store Management console.
            </div>
          )}
        </div>
      )}

      {/* 3. Security & Account Actions Card */}
      <div className="detail-card">
        <h2 className="detail-section-title">
          <Shield size={20} color="var(--primary)" />
          Security & Credentials
        </h2>

        <div className="detail-grid">
          <div>
            <div className="detail-item-label">Authentication Protection</div>
            <div className="detail-item-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#059669' }}>
              <CheckCircle2 size={16} /> Bcrypt Hash & Stateless JWT
            </div>
          </div>

          <div>
            <div className="detail-item-label">Last Profile Update</div>
            <div className="detail-item-value" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
              <Clock size={15} color="var(--text-muted)" />
              {formatDate(user.updated_at || user.created_at)}
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.75rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
            <Link to="/user/change-password" className="btn btn-primary btn-sm">
              <KeyRound size={15} /> Update Account Password
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
