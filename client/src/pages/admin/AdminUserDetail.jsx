import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import FormError from '../../components/common/FormError';
import StarRating from '../../components/common/StarRating';
import Button from '../../components/common/Button';
import { User, Mail, MapPin, Calendar, Shield, Store, ArrowLeft, PlusCircle } from 'lucide-react';

const AdminUserDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await adminService.getUserById(id);
        if (response.success && response.data?.user) {
          setUser(response.data.user);
        }
      } catch (err) {
        setError(err.message || 'Failed to fetch user details.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetail();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Loading user details..." />;
  }

  const renderRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge badge-admin">Administrator</span>;
      case 'STORE_OWNER':
        return <span className="badge badge-owner">Store Owner</span>;
      case 'USER':
      default:
        return <span className="badge badge-user">Normal User</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => navigate('/admin/users')}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.825rem' }}
        >
          <ArrowLeft size={14} /> Back to Users List
        </button>
      </div>

      {error && <FormError message={error} type="danger" />}

      {user && (
        <>
          <div className="page-header" style={{ marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <h1 className="page-title" style={{ fontSize: '1.75rem' }}>{user.name}</h1>
                {renderRoleBadge(user.role)}
              </div>
              <p className="page-subtitle">Platform User #{user.id} Profile & Permissions</p>
            </div>
          </div>

          {/* User Profile Information Card */}
          <div className="detail-card">
            <h2 className="detail-section-title">
              <User size={20} color="var(--primary)" />
              Account Details
            </h2>

            <div className="detail-grid">
              <div>
                <div className="detail-item-label">Full Name</div>
                <div className="detail-item-value">{user.name}</div>
              </div>

              <div>
                <div className="detail-item-label">Email Address</div>
                <div className="detail-item-value" style={{ fontFamily: 'monospace' }}>
                  {user.email}
                </div>
              </div>

              <div>
                <div className="detail-item-label">Role</div>
                <div className="detail-item-value" style={{ marginTop: '0.2rem' }}>
                  {renderRoleBadge(user.role)}
                </div>
              </div>

              <div>
                <div className="detail-item-label">Member Since</div>
                <div className="detail-item-value">{formatDate(user.created_at)}</div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <div className="detail-item-label">Physical Address</div>
                <div className="detail-item-value" style={{ fontWeight: 400 }}>
                  {user.address}
                </div>
              </div>
            </div>
          </div>

          {/* If STORE_OWNER: Display their Store and Average Rating */}
          {user.role === 'STORE_OWNER' && (
            <div className="detail-card">
              <h2 className="detail-section-title">
                <Store size={20} color="var(--primary)" />
                Managed Store & Rating Reputation
              </h2>

              {user.store ? (
                <div className="detail-grid">
                  <div>
                    <div className="detail-item-label">Store Name</div>
                    <div className="detail-item-value" style={{ fontSize: '1.15rem' }}>
                      {user.store.name}
                    </div>
                  </div>

                  <div>
                    <div className="detail-item-label">Store Contact Email</div>
                    <div className="detail-item-value" style={{ fontFamily: 'monospace' }}>
                      {user.store.email}
                    </div>
                  </div>

                  <div>
                    <div className="detail-item-label">Reputation Score</div>
                    <div className="detail-item-value" style={{ marginTop: '0.35rem' }}>
                      <StarRating
                        rating={user.store.average_rating}
                        count={user.store.total_ratings}
                        size={18}
                      />
                    </div>
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <div className="detail-item-label">Store Location</div>
                    <div className="detail-item-value" style={{ fontWeight: 400 }}>
                      {user.store.address}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    background: 'var(--bg-subtle)',
                    padding: '1.5rem',
                    borderRadius: 'var(--radius-md)',
                    textAlign: 'center'
                  }}
                >
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    This user holds the <strong>STORE_OWNER</strong> role, but is not currently assigned to manage any store.
                  </p>
                  <Link to="/admin/stores/create" className="btn btn-primary" style={{ display: 'inline-flex' }}>
                    <PlusCircle size={15} /> Create Store & Assign Owner
                  </Link>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminUserDetail;
