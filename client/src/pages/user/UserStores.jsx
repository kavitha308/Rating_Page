import React, { useState, useEffect, useCallback } from 'react';
import storeService from '../../services/storeService';
import useDebounce from '../../hooks/useDebounce';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import StarRating from '../../components/common/StarRating';
import Button from '../../components/common/Button';
import FormError from '../../components/common/FormError';
import RatingModal from '../../components/stores/RatingModal';
import { Store, Star, Edit3, MapPin, CheckCircle2 } from 'lucide-react';

const UserStores = () => {
  // Store listing state
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successNotification, setSuccessNotification] = useState('');

  // Search & Debounce state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 350);

  // Sorting state
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Rating Modal state
  const [selectedStoreForRating, setSelectedStoreForRating] = useState(null);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  // Reset page to 1 when search query changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Fetch stores using backend pagination and search API
  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit,
        sortBy,
        sortOrder,
        search: debouncedSearch.trim() || undefined
      };

      const response = await storeService.getStores(params);
      if (response.success && response.data) {
        setStores(response.data.stores);
        if (response.meta?.pagination) {
          setTotalItems(response.meta.pagination.total);
          setTotalPages(response.meta.pagination.totalPages);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load stores. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, debouncedSearch]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Handle rating submission or modification success
  const handleRatingSuccess = ({ storeId, storeName, newRating, overallRating, totalRatings, isEditing }) => {
    // 1. Immediate optimistic UI update
    setStores((prevStores) =>
      prevStores.map((s) => {
        if (s.id === storeId) {
          return {
            ...s,
            user_submitted_rating: newRating,
            overall_rating: overallRating !== undefined ? overallRating : s.overall_rating,
            total_ratings: totalRatings !== undefined ? totalRatings : s.total_ratings + (isEditing ? 0 : 1)
          };
        }
        return s;
      })
    );

    // 2. Set success feedback message
    const actionText = isEditing ? 'updated' : 'submitted';
    setSuccessNotification(
      `Your ${newRating}-star rating for "${storeName}" has been ${actionText} successfully!`
    );

    // 3. Auto-clear notification after 6 seconds
    setTimeout(() => {
      setSuccessNotification('');
    }, 6000);
  };

  const handleOpenRatingModal = (store) => {
    setSelectedStoreForRating(store);
    setIsRatingModalOpen(true);
  };

  const handleSort = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  };

  // Columns Definition
  const columns = [
    {
      key: 'name',
      label: 'Store Name',
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
            {val}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Store #{row.id}
          </div>
        </div>
      )
    },
    {
      key: 'address',
      label: 'Address',
      sortable: true,
      render: (val) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <MapPin size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <span
            style={{
              display: 'inline-block',
              maxWidth: '300px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={val}
          >
            {val}
          </span>
        </div>
      )
    },
    {
      key: 'rating',
      label: 'Overall Rating',
      sortable: true,
      render: (_, row) => (
        <StarRating
          rating={row.overall_rating}
          count={row.total_ratings}
          size={16}
        />
      )
    },
    {
      key: 'my_rating',
      label: 'My Rating',
      sortable: false,
      render: (_, row) => {
        const hasRated = row.user_submitted_rating !== null && row.user_submitted_rating !== undefined;

        if (hasRated) {
          return (
            <span className="my-rating-badge active">
              <Star size={13} fill="#f59e0b" color="#f59e0b" />
              <span>My Rating: {row.user_submitted_rating}/5</span>
            </span>
          );
        }

        return (
          <span className="my-rating-badge unrated">
            No rating submitted
          </span>
        );
      }
    },
    {
      key: 'action',
      label: 'Action',
      sortable: false,
      align: 'right',
      render: (_, row) => {
        const hasRated = row.user_submitted_rating !== null && row.user_submitted_rating !== undefined;

        return hasRated ? (
          <Button
            variant="secondary"
            size="sm"
            icon={Edit3}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }}
            onClick={() => handleOpenRatingModal(row)}
            title="Modify your rating"
          >
            Modify Rating
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            icon={Star}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem' }}
            onClick={() => handleOpenRatingModal(row)}
            title="Rate this store"
          >
            Rate Store
          </Button>
        );
      }
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="brand-badge" style={{ marginBottom: '0.5rem' }}>
            <Store size={14} /> Consumer Portal
          </div>
          <h1 className="page-title">Browse & Rate Stores</h1>
          <p className="page-subtitle">
            Explore local stores, review customer ratings, and submit or modify your ratings
          </p>
        </div>
      </div>

      {/* Success Notification Feedback */}
      {successNotification && (
        <FormError message={successNotification} type="success" />
      )}

      {error && <FormError message={error} type="danger" />}

      {/* Search Toolbar */}
      <div className="action-toolbar">
        <div className="toolbar-search-group" style={{ maxWidth: 500 }}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            onClear={() => setSearchTerm('')}
            placeholder="Search stores by name or address (auto-debounced)..."
          />
        </div>

        {debouncedSearch && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Search results for: <strong>"{debouncedSearch}"</strong>
          </div>
        )}
      </div>

      {/* Reusable DataTable Component */}
      <DataTable
        columns={columns}
        data={stores}
        loading={loading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyTitle="No stores found"
        emptyDescription={
          debouncedSearch
            ? `No stores matched your search "${debouncedSearch}". Try searching for another name or location.`
            : 'There are currently no stores available in the catalog.'
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

      {/* Rating Submission / Modification Modal */}
      <RatingModal
        isOpen={isRatingModalOpen}
        onClose={() => setIsRatingModalOpen(false)}
        store={selectedStoreForRating}
        onRatingSuccess={handleRatingSuccess}
      />
    </div>
  );
};

export default UserStores;
