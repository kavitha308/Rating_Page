import React from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import Button from './Button';
import StarRating from './StarRating';
import {
  User as UserIcon,
  Mail,
  MapPin,
  Calendar,
  ShieldCheck,
  Award,
  Hash,
  Store,
  KeyRound,
  Sparkles
} from 'lucide-react';

/**
 * ProfileModal Component
 * Displays comprehensive user identity information when user clicks their navbar profile pill.
 */
const ProfileModal = ({ isOpen = false, onClose, user, onLogout }) => {
  const navigate = useNavigate();

  if (!user) return null;

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
          icon: UserIcon,
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
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const handlePasswordRedirect = () => {
    onClose();
    navigate('/user/change-password');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Profile"
      subtitle="Account details and identity information"
      maxWidth="580px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', gap: '0.75rem' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={KeyRound}
            onClick={handlePasswordRedirect}
          >
            Change Password
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      }
    >
      <div className="profile-modal-content">
        {/* Profile Hero Header Card */}
        <div className="profile-hero-card">
          <div className="profile-avatar-large">
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="profile-hero-info">
            <h3 className="profile-hero-name">{user.name}</h3>
            <div className="profile-hero-email">{user.email}</div>
            <div className="profile-hero-badge-wrap">
              <span className={`badge ${roleInfo.badgeClass}`}>
                <RoleIcon size={12} style={{ marginRight: 4 }} />
                {roleInfo.label}
              </span>
              <span className="profile-id-tag">
                <Hash size={11} style={{ marginRight: 2 }} />
                ID: #{user.id}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="profile-info-grid">
          {/* Full Name */}
          <div className="profile-info-item">
            <div className="profile-info-label">
              <UserIcon size={14} className="profile-field-icon" />
              <span>Full Name</span>
            </div>
            <div className="profile-info-value">{user.name}</div>
          </div>

          {/* Email Address */}
          <div className="profile-info-item">
            <div className="profile-info-label">
              <Mail size={14} className="profile-field-icon" />
              <span>Email Address</span>
            </div>
            <div className="profile-info-value mono-val">{user.email}</div>
          </div>

          {/* Role & Permissions */}
          <div className="profile-info-item">
            <div className="profile-info-label">
              <RoleIcon size={14} className="profile-field-icon" />
              <span>Account Role</span>
            </div>
            <div className="profile-info-value">
              <span className={`badge ${roleInfo.badgeClass}`}>{roleInfo.label}</span>
            </div>
            <div className="profile-role-desc">{roleInfo.description}</div>
          </div>

          {/* Member Since */}
          <div className="profile-info-item">
            <div className="profile-info-label">
              <Calendar size={14} className="profile-field-icon" />
              <span>Member Since</span>
            </div>
            <div className="profile-info-value">
              {formatDate(user.created_at)}
            </div>
          </div>

          {/* Physical Address */}
          <div className="profile-info-item profile-info-full">
            <div className="profile-info-label">
              <MapPin size={14} className="profile-field-icon" />
              <span>Physical Address</span>
            </div>
            <div className="profile-info-value address-val">
              {user.address || 'No address provided'}
            </div>
          </div>
        </div>

        {/* Store Owner Merchant Card (if role is STORE_OWNER) */}
        {user.role === 'STORE_OWNER' && user.store && (
          <div className="profile-store-section">
            <div className="profile-store-header">
              <div className="profile-store-icon-wrap">
                <Store size={18} />
              </div>
              <div>
                <h4 className="profile-store-title">Assigned Merchant Store</h4>
                <p className="profile-store-sub">Store details linked to this merchant account</p>
              </div>
            </div>

            <div className="profile-store-body">
              <div className="profile-store-name">{user.store.name}</div>
              <div className="profile-store-meta-row">
                <span className="profile-store-meta">
                  <Mail size={12} />
                  {user.store.email}
                </span>
                <span className="profile-store-meta">
                  <MapPin size={12} />
                  {user.store.address}
                </span>
              </div>

              <div className="profile-store-rating-box">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  Store Rating:
                </span>
                <StarRating
                  rating={user.store.average_rating || 0}
                  count={user.store.total_ratings || 0}
                  size={15}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default ProfileModal;
