import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import FormError from '../../components/common/FormError';
import StarRating from '../../components/common/StarRating';
import { Store, PlusCircle, Edit } from 'lucide-react';

const AdminStores = () => {
  const navigate = useNavigate();

  // Table state
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search state
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');

  // Sorting state
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('ASC');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch stores from API
  const fetchStores = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit,
        sortBy,
        sortOrder,
        search: appliedSearch
      };

      const response = await adminService.getStores(params);
      if (response.success && response.data) {
        setStores(response.data.stores);
        if (response.meta?.pagination) {
          setTotalItems(response.meta.pagination.total);
          setTotalPages(response.meta.pagination.totalPages);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch stores list.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, appliedSearch]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Handle Search Submission
  const handleSearchSubmit = () => {
    setPage(1);
    setAppliedSearch(search.trim());
  };

  const handleSearchClear = () => {
    setSearch('');
    setPage(1);
    setAppliedSearch('');
  };

  // Handle Sort
  const handleSort = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  };

  // Columns definition
  const columns = [
    {
      key: 'name',
      label: 'Store Name',
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{val}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Store #{row.id}</div>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (val) => (
        <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
          {val}
        </span>
      )
    },
    {
      key: 'address',
      label: 'Address',
      sortable: true,
      render: (val) => (
        <span
          style={{
            display: 'inline-block',
            maxWidth: '280px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={val}
        >
          {val}
        </span>
      )
    },
    {
      key: 'owner_name',
      label: 'Store Owner',
      sortable: false,
      render: (val, row) => {
        if (val) {
          return (
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{val}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                {row.owner_email}
              </div>
            </div>
          );
        }
        return <span className="badge badge-neutral">Unassigned</span>;
      }
    },
    {
      key: 'rating',
      label: 'Overall Rating',
      sortable: true,
      render: (_, row) => (
        <StarRating
          rating={row.average_rating}
          count={row.total_ratings}
          size={15}
        />
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      align: 'right',
      render: (_, row) => (
        <Link
          to={`/admin/stores/${row.id}/edit`}
          className="btn btn-secondary btn-sm"
          style={{ padding: '0.35rem 0.65rem', fontSize: '0.785rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Edit size={13} />
          <span>Edit</span>
        </Link>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="brand-badge" style={{ marginBottom: '0.5rem' }}>
            <Store size={14} /> Store Directory
          </div>
          <h1 className="page-title">Store Management</h1>
          <p className="page-subtitle">
            Manage merchants, inspect customer ratings, and assign store owners
          </p>
        </div>

        <div className="page-actions">
          <Link to="/admin/stores/create" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Add Store</span>
          </Link>
        </div>
      </div>

      {error && <FormError message={error} type="danger" />}

      {/* Toolbar: Search */}
      <div className="action-toolbar">
        <div className="toolbar-search-group">
          <SearchBar
            value={search}
            onChange={setSearch}
            onSubmit={handleSearchSubmit}
            onClear={handleSearchClear}
            placeholder="Search stores by name, email, or address..."
          />
          <Button variant="secondary" onClick={handleSearchSubmit} style={{ padding: '0.65rem 1rem' }}>
            Search
          </Button>
        </div>
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
          appliedSearch
            ? 'No stores match your search keyword. Try clearing the search.'
            : 'There are currently no stores in the platform.'
        }
        emptyActionLabel={appliedSearch ? 'Clear Search' : 'Add First Store'}
        onEmptyAction={appliedSearch ? handleSearchClear : () => navigate('/admin/stores/create')}
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
  );
};

export default AdminStores;
