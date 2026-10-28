import React, { useState, useEffect, useCallback } from 'react';
import ownerService from '../../services/ownerService';
import useDebounce from '../../hooks/useDebounce';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import StarRating from '../../components/common/StarRating';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import FormError from '../../components/common/FormError';
import EmptyState from '../../components/common/EmptyState';
import { Store, Mail, MapPin, Star, Award, TrendingUp, Layers, CheckCircle } from 'lucide-react';

const OwnerDashboard = () => {
  // Dashboard overview state
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState('');

  // Store filter for ratings
  const [selectedStoreFilter, setSelectedStoreFilter] = useState('');

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

  // Reset page to 1 when search or store filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedStoreFilter]);

  // 2. Fetch Paginated Ratings List across all stores owned by this owner
  const fetchRatings = useCallback(async () => {
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
        search: debouncedSearch.trim() || undefined,
        storeId: selectedStoreFilter || undefined
      };

      const response = await ownerService.getRatings(params);
      if (response.success && response.data) {
        setRatings(response.data.ratings || []);
        if (response.meta?.pagination) {
          setTotalItems(response.meta.pagination.total);
          setTotalPages(response.meta.pagination.totalPages);
        }
      }
    } catch (err) {
      if (err.status !== 404) {
        setRatingsError(err.message || 'Failed to fetch customer ratings.');
      }
    } finally {
      setLoadingRatings(false);
    }
  }, [page, limit, sortBy, sortOrder, debouncedSearch, selectedStoreFilter, dashboardData]);

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
        day: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const managedStores = dashboardData?.stores || (dashboardData?.store ? [dashboardData.store] : []);
  const showStoreColumn = managedStores.length > 1;

  // Columns Definition
  const columns = [
    ...(showStoreColumn
      ? [
          {
            key: 'storeName',
            label: 'Store',
            sortable: true,
            render: (_, row) => (
              <div>
                <div style={{ fontWeight: 700, color: 'var(--primary)' }}>
                  {row.store_name || '—'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Store #{row.store_id}
                </div>
              </div>
            )
          }
        ]
      : []),
    {
      key: 'userName',
      label: 'User Name',
      sortable: true,
      render: (_, row) => (
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

  if (dashboardError) {
    return (
      <div className="page-container" style={{ maxWidth: 760 }}>
        <FormError message={dashboardError} type="danger" />
      </div>
    );
  }

  // Handle case where administrator has not assigned a store yet (0 stores)
  if (!dashboardData || !dashboardData.hasAssignedStore || managedStores.length === 0) {
    return (
      <div className="page-container" style={{ maxWidth: 760 }}>
        <EmptyState
          icon={Store}
          title="No Stores Assigned Yet"
          description="Your account holds the Store Owner role, but the platform administrator has not assigned any stores to your account yet. Once an administrator assigns stores to you, they will appear here."
        />
      </div>
    );
  }

  const { metrics } = dashboardData || {};
  const overallAverageRating = metrics?.average_rating || 0;
  const overallTotalRatings = metrics?.total_ratings || 0;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="brand-badge" style={{ marginBottom: '0.5rem' }}>
            <Award size={14} /> Store Owner Portal
          </div>
          <h1 className="page-title">Merchant Command Center</h1>
          <p className="page-subtitle">
            Stores Managed: <strong>{managedStores.length}</strong> • Performance metrics & consumer ratings
          </p>
        </div>
      </div>

      {dashboardError && <FormError message={dashboardError} type="danger" />}

      {/* 1. Overall Portfolio Aggregate (if managing multiple stores) */}
      {managedStores.length > 1 && (
        <div className="detail-card" style={{ marginBottom: '2rem', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <Layers size={18} color="var(--primary)" />
                <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                  Overall Portfolio Reputation
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Combined weighted average score across all <strong>{managedStores.length}</strong> assigned stores
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)' }}>
                  {overallAverageRating > 0 ? overallAverageRating.toFixed(1) : '0.0'}
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}> / 5</span>
                </div>
                <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
                  {overallTotalRatings} total {overallTotalRatings === 1 ? 'review' : 'reviews'} across all stores
                </div>
              </div>
              <StarRating rating={overallAverageRating} size={20} showValue={false} />
            </div>
          </div>
        </div>
      )}

      {/* 2. Individual Store Cards: Each store with its own Average Rating & Breakdown */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Store size={18} color="var(--primary)" />
          Individual Store Reputations ({managedStores.length})
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {managedStores.map((st) => {
            const avg = st.average_rating || 0;
            const cnt = st.total_ratings || 0;
            const dist = st.rating_distribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

            return (
              <div
                key={st.id}
                className="detail-card"
                style={{
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {st.name}
                      </h3>
                      <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '0.15rem' }}>
                        Store #{st.id} • {st.email}
                      </div>
                    </div>
                    <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
                      <CheckCircle size={12} /> Active
                    </span>
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1.25rem' }}>
                    <MapPin size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={st.address}>
                      {st.address}
                    </span>
                  </div>

                  {/* Rating Highlight for this specific store */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      background: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '1rem'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
                        Store Average
                      </div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.2 }}>
                        {avg > 0 ? avg.toFixed(1) : '0.0'}
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}> / 5</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <StarRating rating={avg} size={17} showValue={false} />
                      <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {cnt} customer {cnt === 1 ? 'rating' : 'ratings'}
                      </div>
                    </div>
                  </div>

                  {/* Mini Star Breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                    {[5, 4, 3, 2, 1].map((star) => {
                      const count = dist[star] || 0;
                      const pct = cnt > 0 ? Math.round((count / cnt) * 100) : 0;
                      return (
                        <div key={star} style={{ display: 'flex', alignItems: 'center', fontSize: '0.75rem', gap: '0.5rem' }}>
                          <span style={{ width: '12px', textAlign: 'right', fontWeight: 600 }}>{star}</span>
                          <Star size={11} fill="#f59e0b" color="#f59e0b" />
                          <div style={{ flex: 1, height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b' }} />
                          </div>
                          <span style={{ width: '24px', textAlign: 'right', color: 'var(--text-muted)' }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Customer Ratings Section across All Stores */}
      <div style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Customer Feedback & Rating Log
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
              Reviews and star ratings submitted by verified consumers across your stores
            </p>
          </div>
        </div>

        {ratingsError && <FormError message={ratingsError} type="danger" />}

        {/* Toolbar: Search & Optional Store Selector */}
        <div className="action-toolbar" style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="toolbar-search-group" style={{ maxWidth: 380, flex: 1 }}>
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              onClear={() => setSearchTerm('')}
              placeholder="Filter by customer name or email..."
            />
          </div>

          {managedStores.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label htmlFor="storeFilter" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Store:
              </label>
              <select
                id="storeFilter"
                value={selectedStoreFilter}
                onChange={(e) => setSelectedStoreFilter(e.target.value)}
                className="form-control"
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem', minWidth: '200px' }}
              >
                <option value="">All Managed Stores ({managedStores.length})</option>
                {managedStores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
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
            debouncedSearch || selectedStoreFilter
              ? 'No ratings matching your current search or store filter. Try resetting filters.'
              : 'Your stores have not received any customer ratings yet.'
          }
          emptyActionLabel={debouncedSearch || selectedStoreFilter ? 'Clear Filters' : undefined}
          onEmptyAction={() => {
            setSearchTerm('');
            setSelectedStoreFilter('');
          }}
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
