import React, { useState, useEffect, useCallback } from 'react';
import ownerService from '../../services/ownerService';
import useDebounce from '../../hooks/useDebounce';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import StarRating from '../../components/common/StarRating';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import FormError from '../../components/common/FormError';
import EmptyState from '../../components/common/EmptyState';
import { Store, Mail, MapPin, Star, Award, TrendingUp, Users, MessageSquare } from 'lucide-react';

const OwnerDashboard = () => {
  // Dashboard overview state
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  // Ratings table state
  const [ratings, setRatings] = useState([]);
  const [loadingRatings, setLoadingRatings] = useState(true);
  const [ratingsError, setRatingsError] = useState('');

  // Search & Debounce state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 350);

  // Sorting state
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // 1. Fetch Dashboard Overview (Store details & aggregated statistics)
  const fetchDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    setDashboardError('');
    try {
      const response = await ownerService.getDashboard();
      if (response.success && response.data) {
        setDashboardData(response.data);
      }
    } catch (err) {
      setDashboardError(err.message || 'Failed to load merchant store information.');
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Reset page to 1 when search term changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // 2. Fetch Paginated Ratings List for this owner's store
  const fetchRatings = useCallback(async () => {
    // Only fetch ratings if owner has an assigned store
    if (dashboardData && !dashboardData.hasAssignedStore) {
      setLoadingRatings(false);
      return;
    }

    setLoadingRatings(true);
    setRatingsError('');
    try {
      const params = {
        page,
        limit,
        sortBy,
        sortOrder,
        search: debouncedSearch.trim() || undefined
      };

      const response = await ownerService.getRatings(params);
      if (response.success && response.data) {
        setRatings(response.data.ratings);
        if (response.meta?.pagination) {
          setTotalItems(response.meta.pagination.total);
          setTotalPages(response.meta.pagination.totalPages);
        }
      }
    } catch (err) {
      // If store is unassigned, 404 is handled gracefully
      if (err.status !== 404) {
        setRatingsError(err.message || 'Failed to fetch customer ratings.');
      }
    } finally {
      setLoadingRatings(false);
    }
  }, [page, limit, sortBy, sortOrder, debouncedSearch, dashboardData]);

  useEffect(() => {
    if (dashboardData?.hasAssignedStore) {
      fetchRatings();
    }
  }, [fetchRatings, dashboardData]);

  const handleSort = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  // Columns Definition (strictly non-modifiable by Store Owner)
  const columns = [
    {
      key: 'userName',
      label: 'User Name',
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{row.user_name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified Consumer</div>
        </div>
      )
    },
    {
      key: 'userEmail',
      label: 'User Email',
      sortable: true,
      render: (_, row) => (
        <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
          {row.user_email}
        </span>
      )
    },
    {
      key: 'rating',
      label: 'Rating',
      sortable: true,
      render: (val) => (
        <StarRating rating={val} size={15} showValue={true} />
      )
    },
    {
      key: 'created_at',
      label: 'Submitted Date',
      sortable: true,
      render: (val) => (
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {formatDate(val)}
        </span>
      )
    }
  ];

  if (loadingDashboard) {
    return <LoadingSpinner message="Loading Store Owner Dashboard..." />;
  }

  // Handle case where administrator has not assigned a store yet
  if (dashboardData && !dashboardData.hasAssignedStore) {
    return (
      <div className="page-container" style={{ maxWidth: 760 }}>
        <EmptyState
          icon={Store}
          title="No Store Assigned Yet"
          description="Your account holds the Store Owner role, but the platform administrator has not assigned a store to your account yet. Please contact your system administrator to assign your store."
        />
      </div>
    );
  }

  const { store, metrics } = dashboardData || {};
  const averageRating = metrics?.average_rating || 0;
  const totalRatings = metrics?.total_ratings || 0;
  const distribution = metrics?.rating_distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="brand-badge" style={{ marginBottom: '0.5rem' }}>
            <Award size={14} /> Store Owner Portal
          </div>
          <h1 className="page-title">{store?.name}</h1>
          <p className="page-subtitle">
            Reputation analytics, consumer ratings, and customer feedback insights
          </p>
        </div>
      </div>

      {dashboardError && <FormError message={dashboardError} type="danger" />}

      {/* 1. Store Information Overview Card */}
      <div className="detail-card" style={{ marginBottom: '2rem' }}>
        <h2 className="detail-section-title">
          <Store size={20} color="var(--primary)" />
          Store Profile
        </h2>

        <div className="detail-grid">
          <div>
            <div className="detail-item-label">Store Name</div>
            <div className="detail-item-value">{store?.name}</div>
          </div>

          <div>
            <div className="detail-item-label">Contact Email</div>
            <div className="detail-item-value" style={{ fontFamily: 'monospace' }}>
              {store?.email}
            </div>
          </div>

          <div>
            <div className="detail-item-label">Merchant ID</div>
            <div className="detail-item-value">#{store?.id}</div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div className="detail-item-label">Physical Location</div>
            <div className="detail-item-value" style={{ fontWeight: 400, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <span>{store?.address}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Rating Analytics & Star Distribution Breakdown */}
      <div className="detail-card" style={{ marginBottom: '2rem' }}>
        <h2 className="detail-section-title">
          <TrendingUp size={20} color="var(--primary)" />
          Reputation & Score Analytics
        </h2>

        <div className="rating-overview-grid">
          {/* Average Rating Highlight Box */}
          <div className="rating-score-highlight">
            <div className="rating-big-number">
              {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
              <StarRating rating={averageRating} size={22} showValue={false} />
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Based on <strong>{totalRatings}</strong> {totalRatings === 1 ? 'review' : 'reviews'}
            </div>
          </div>

          {/* 5-Star Breakdown Progress Bars */}
          <div className="rating-breakdown-bars">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = distribution[stars] || 0;
              const percentage = totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0;

              return (
                <div key={stars} className="breakdown-row">
                  <div className="breakdown-label">
                    <span>{stars}</span>
                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                  </div>

                  <div className="progress-track" title={`${percentage}% (${count} reviews)`}>
                    <div className="progress-fill" style={{ width: `${percentage}%` }} />
                  </div>

                  <div className="breakdown-count">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Ratings Table Section */}
      <div style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Customer Feedback & Rating Log
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              List of verified users who submitted reviews for your store
            </p>
          </div>
        </div>

        {ratingsError && <FormError message={ratingsError} type="danger" />}

        {/* Toolbar: Search */}
        <div className="action-toolbar">
          <div className="toolbar-search-group" style={{ maxWidth: 450 }}>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={() => setSearchTerm('')}
              placeholder="Filter by customer name or email..."
            />
          </div>

          {debouncedSearch && (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Filtering results for: <strong>"{debouncedSearch}"</strong>
            </div>
          )}
        </div>

        {/* Reusable DataTable Component */}
        <DataTable
          columns={columns}
          data={ratings}
          loading={loadingRatings}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          emptyTitle="No ratings found"
          emptyDescription={
            debouncedSearch
              ? `No ratings matching "${debouncedSearch}". Try clearing your search.`
              : 'Your store has not received any ratings yet. Ratings submitted by consumers will automatically appear here.'
          }
          emptyActionLabel={debouncedSearch ? 'Clear Search' : undefined}
          onEmptyAction={() => setSearchTerm('')}
          pagination={{
            currentPage: page,
            totalPages,
            totalItems,
            pageSize: limit,
            onPageChange: (newPage) => setPage(newPage),
            onPageSizeChange: (newLimit) => {
              setLimit(newLimit);
              setPage(1);
            }
          }}
        />
      </div>
    </div>
  );
};

export default OwnerDashboard;
