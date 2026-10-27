import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import FilterPanel from '../../components/common/FilterPanel';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import PasswordInput from '../../components/common/PasswordInput';
import FormError from '../../components/common/FormError';
import StarRating from '../../components/common/StarRating';
import { Users, UserPlus, Eye, ShieldCheck, Mail, MapPin, Store } from 'lucide-react';

const AdminUsers = () => {
  const navigate = useNavigate();

  // Table state
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Sorting state
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Add User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalSubErrors, setModalSubErrors] = useState([]);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    address: '',
    role: 'USER',
    password: ''
  });
  const [newUserValidationErrors, setNewUserValidationErrors] = useState({});

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit,
        sortBy,
        sortOrder,
        search: appliedSearch,
        role: roleFilter || undefined
      };

      const response = await adminService.getUsers(params);
      if (response.success && response.data) {
        setUsers(response.data.users);
        if (response.meta?.pagination) {
          setTotalItems(response.meta.pagination.total);
          setTotalPages(response.meta.pagination.totalPages);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch users list.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, sortBy, sortOrder, appliedSearch, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  // Handle Filter Change
  const handleRoleFilterChange = (key, value) => {
    setRoleFilter(value);
    setPage(1);
  };

  const handleFilterReset = () => {
    setSearch('');
    setAppliedSearch('');
    setRoleFilter('');
    setPage(1);
  };

  // Handle Sort Change
  const handleSort = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
    setPage(1);
  };

  // Add User Validation
  const validateNewUser = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,16}$/;

    const trimmedName = newUser.name.trim();
    if (!trimmedName) {
      errors.name = 'Name is required';
    } else if (trimmedName.length < 20 || trimmedName.length > 60) {
      errors.name = `Name must be 20-60 characters (currently ${trimmedName.length})`;
    }

    const trimmedEmail = newUser.email.trim();
    if (!trimmedEmail) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please provide a valid email address';
    }

    const trimmedAddress = newUser.address.trim();
    if (!trimmedAddress) {
      errors.address = 'Address is required';
    } else if (trimmedAddress.length > 400) {
      errors.address = `Address cannot exceed 400 characters (currently ${trimmedAddress.length})`;
    }

    if (!newUser.password) {
      errors.password = 'Password is required';
    } else if (!passwordRegex.test(newUser.password)) {
      errors.password = 'Password must be 8-16 chars with at least 1 uppercase and 1 special char';
    }

    setNewUserValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Add User Submission
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setModalError('');
    setModalSubErrors([]);

    if (!validateNewUser()) return;

    setModalLoading(true);
    try {
      await adminService.createUser({
        name: newUser.name.trim(),
        email: newUser.email.trim(),
        address: newUser.address.trim(),
        role: newUser.role,
        password: newUser.password
      });

      setSuccessMessage(`User "${newUser.name.trim()}" created successfully!`);
      setIsModalOpen(false);
      setNewUser({
        name: '',
        email: '',
        address: '',
        role: 'USER',
        password: ''
      });
      fetchUsers();
    } catch (err) {
      setModalError(err.message || 'Failed to create user.');
      setModalSubErrors(err.errors || []);
    } finally {
      setModalLoading(false);
    }
  };

  // Role Badge Helper
  const renderRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="badge badge-admin">Admin</span>;
      case 'STORE_OWNER':
        return <span className="badge badge-owner">Store Owner</span>;
      case 'USER':
      default:
        return <span className="badge badge-user">Normal User</span>;
    }
  };

  // Table Columns Definition
  const columns = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{val}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: #{row.id}</div>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Email Address',
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
            maxWidth: '260px',
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
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (val) => renderRoleBadge(val)
    },
    {
      key: 'store_rating',
      label: 'Store & Rating',
      sortable: false,
      render: (_, row) => {
        if (row.role === 'STORE_OWNER') {
          if (row.store) {
            return (
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{row.store.name}</div>
                <StarRating rating={row.store.average_rating} count={row.store.total_ratings} size={14} />
              </div>
            );
          }
          return <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Unassigned store</span>;
        }
        return <span style={{ color: 'var(--text-muted)' }}>—</span>;
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      align: 'right',
      render: (_, row) => (
        <Button
          variant="secondary"
          size="sm"
          icon={Eye}
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/admin/users/${row.id}`);
          }}
        >
          View Details
        </Button>
      )
    }
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="brand-badge" style={{ marginBottom: '0.5rem' }}>
            <Users size={14} /> User Accounts
          </div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">
            Search, filter, view details, and create new administrators, store owners, or consumers
          </p>
        </div>

        <div className="page-actions">
          <Button
            variant="primary"
            icon={UserPlus}
            onClick={() => {
              setModalError('');
              setModalSubErrors([]);
              setNewUserValidationErrors({});
              setIsModalOpen(true);
            }}
          >
            Add New User
          </Button>
        </div>
      </div>

      {successMessage && <FormError message={successMessage} type="success" />}
      {error && <FormError message={error} type="danger" />}

      {/* Toolbar: Search + Role Filter */}
      <div className="action-toolbar">
        <div className="toolbar-search-group">
          <SearchBar
            value={search}
            onChange={setSearch}
            onSubmit={handleSearchSubmit}
            onClear={handleSearchClear}
            placeholder="Search by name, email, or address..."
          />
          <Button variant="secondary" onClick={handleSearchSubmit} style={{ padding: '0.65rem 1rem' }}>
            Search
          </Button>
        </div>

        <FilterPanel
          filters={{ role: roleFilter }}
          filterConfig={[
            {
              key: 'role',
              label: 'Role:',
              options: [
                { value: '', label: 'All Roles' },
                { value: 'USER', label: 'Normal Users' },
                { value: 'STORE_OWNER', label: 'Store Owners' },
                { value: 'ADMIN', label: 'Administrators' }
              ]
            }
          ]}
          onFilterChange={handleRoleFilterChange}
          onReset={handleFilterReset}
        />
      </div>

      {/* Reusable DataTable Component */}
      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyTitle="No users found"
        emptyDescription={
          appliedSearch || roleFilter
            ? 'No users match your active search and filter settings. Try clearing filters.'
            : 'There are currently no users in the database.'
        }
        emptyActionLabel={appliedSearch || roleFilter ? 'Clear All Filters' : undefined}
        onEmptyAction={handleFilterReset}
        onRowClick={(row) => navigate(`/admin/users/${row.id}`)}
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

      {/* Add User Modal Dialog */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New User"
        subtitle="Add a new administrator, store owner, or normal user to the platform"
        maxWidth="540px"
      >
        {modalError && <FormError message={modalError} errors={modalSubErrors} type="danger" />}

        <form onSubmit={handleCreateUser} noValidate>
          <Input
            id="modal-name"
            name="name"
            label="Full Name"
            hint="Min 20, Max 60 characters"
            placeholder="e.g. Christopher James Harrington"
            value={newUser.name}
            onChange={(e) => setNewUser((prev) => ({ ...prev, name: e.target.value }))}
            error={newUserValidationErrors.name}
            icon={Users}
            maxLength={60}
            showCharCount
            disabled={modalLoading}
            required
          />

          <Input
            id="modal-email"
            name="email"
            type="email"
            label="Email Address"
            placeholder="user@example.com"
            value={newUser.email}
            onChange={(e) => setNewUser((prev) => ({ ...prev, email: e.target.value }))}
            error={newUserValidationErrors.email}
            icon={Mail}
            disabled={modalLoading}
            required
          />

          <div className="form-group">
            <label htmlFor="modal-role" className="form-label">
              <span>User Role <span style={{ color: 'var(--danger)' }}>*</span></span>
            </label>
            <select
              id="modal-role"
              value={newUser.role}
              onChange={(e) => setNewUser((prev) => ({ ...prev, role: e.target.value }))}
              className="form-control"
              disabled={modalLoading}
            >
              <option value="USER">Normal User (Submit Reviews)</option>
              <option value="STORE_OWNER">Store Owner (Manage Store)</option>
              <option value="ADMIN">Administrator (Full Access)</option>
            </select>
          </div>

          <Input
            id="modal-address"
            name="address"
            as="textarea"
            label="Physical Address"
            hint="Max 400 characters"
            placeholder="Street address, unit/suite, city, region"
            value={newUser.address}
            onChange={(e) => setNewUser((prev) => ({ ...prev, address: e.target.value }))}
            error={newUserValidationErrors.address}
            icon={MapPin}
            maxLength={400}
            showCharCount
            disabled={modalLoading}
            required
            rows={2}
          />

          <PasswordInput
            id="modal-password"
            name="password"
            label="Initial Password"
            hint="8-16 chars, 1 uppercase, 1 special"
            placeholder="Set secure password"
            value={newUser.password}
            onChange={(e) => setNewUser((prev) => ({ ...prev, password: e.target.value }))}
            error={newUserValidationErrors.password}
            disabled={modalLoading}
            required
            showRequirements
          />

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <Button
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
              disabled={modalLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={modalLoading}
              icon={UserPlus}
            >
              Create User
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminUsers;
