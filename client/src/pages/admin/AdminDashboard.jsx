import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import FormError from '../../components/common/FormError';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Users, Store, Star, PlusCircle, ArrowRight, ShieldCheck, UserCheck, Award } from 'lucide-react';

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminService.getDashboard();
      if (response.success && response.data) {
        setMetrics(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load administrator metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading platform analytics..." />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="brand-badge" style={{ marginBottom: '0.5rem' }}>
            <ShieldCheck size={14} /> Administrator Control Center
          </div>
          <h1 className="page-title">Platform Dashboard</h1>
          <p className="page-subtitle">
            System metrics, directory metrics, store reputation, and administrative actions
          </p>
        </div>

        <div className="page-actions">
          <Link to="/admin/stores/create" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Add Store</span>
          </Link>
          <Link to="/admin/users" className="btn btn-secondary">
            <Users size={16} />
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      {error && <FormError message={error} type="danger" />}

      {metrics && (
        <>
          {/* Main 3 Metrics Cards */}
          <div className="stat-grid">
            {/* 1. Total Users Card */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">User Directory</span>
                <div className="stat-icon-badge stat-icon-users">
                  <Users size={22} />
                </div>
              </div>

              <div className="stat-value">{metrics.users.total}</div>

              <div className="stat-breakdown">
                <div className="stat-breakdown-item">
                  <strong>{metrics.users.normal_users}</strong> Users
                </div>
                <div className="stat-breakdown-item">
                  <strong>{metrics.users.store_owners}</strong> Owners
                </div>
                <div className="stat-breakdown-item">
                  <strong>{metrics.users.admins}</strong> Admins
                </div>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <Link
                  to="/admin/users"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.825rem',
                    fontWeight: 600
                  }}
                >
                  View user directory <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* 2. Total Stores Card */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Registered Stores</span>
                <div className="stat-icon-badge stat-icon-stores">
                  <Store size={22} />
                </div>
              </div>

              <div className="stat-value">{metrics.stores.total}</div>

              <div className="stat-breakdown">
                <div className="stat-breakdown-item">
                  <strong>{metrics.stores.assigned}</strong> Assigned
                </div>
                <div className="stat-breakdown-item">
                  <strong>{metrics.stores.unassigned}</strong> Unassigned
                </div>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <Link
                  to="/admin/stores"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.825rem',
                    fontWeight: 600
                  }}
                >
                  Browse all stores <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* 3. Total Ratings Card */}
            <div className="stat-card">
              <div className="stat-card-top">
                <span className="stat-card-title">Submitted Ratings</span>
                <div className="stat-icon-badge stat-icon-ratings">
                  <Star size={22} fill="#b45309" />
                </div>
              </div>

              <div className="stat-value">{metrics.ratings.total}</div>

              <div className="stat-breakdown">
                <div className="stat-breakdown-item">
                  Average Score: <strong>{metrics.ratings.system_average.toFixed(1)} / 5.0</strong>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem' }}>
                <Link
                  to="/admin/stores"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.825rem',
                    fontWeight: 600
                  }}
                >
                  Inspect store performance <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Management Section */}
          <div className="detail-card">
            <h2 className="detail-section-title">
              <Award size={20} color="var(--primary)" />
              Administrative Quick Actions
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1rem',
                marginTop: '1rem'
              }}
            >
              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem', fontWeight: 700 }}>
                  Add a New Store Listing
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Register a physical or online merchant location and optionally assign a store owner.
                </p>
                <Link to="/admin/stores/create" className="btn btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.825rem' }}>
                  <PlusCircle size={15} /> Add Store Now
                </Link>
              </div>

              <div
                style={{
                  background: 'var(--bg-subtle)',
                  padding: '1.25rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <h3 style={{ fontSize: '1rem', marginBottom: '0.35rem', fontWeight: 700 }}>
                  Manage User Directory
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  Filter normal users, store owners, and admins. Add new personnel and inspect store owner ratings.
                </p>
                <Link to="/admin/users" className="btn btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.825rem' }}>
                  <UserCheck size={15} /> Open Directory
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
