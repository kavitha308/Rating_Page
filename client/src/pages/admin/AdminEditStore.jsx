import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import FormError from '../../components/common/FormError';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { Store, Mail, MapPin, User, ArrowLeft, Save } from 'lucide-react';

const AdminEditStore = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    ownerId: ''
  });

  const [availableOwners, setAvailableOwners] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [subErrors, setSubErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch store details and available store owners
  useEffect(() => {
    const fetchData = async () => {
      setLoadingInitial(true);
      setLoadingOwners(true);
      try {
        const [storeRes, ownersRes] = await Promise.all([
          adminService.getStoreById(id),
          adminService.getUsers({ role: 'STORE_OWNER', limit: 100 })
        ]);

        if (storeRes.success && storeRes.data?.store) {
          const s = storeRes.data.store;
          setFormData({
            name: s.name || '',
            email: s.email || '',
            address: s.address || '',
            ownerId: s.owner_id ? String(s.owner_id) : ''
          });
        }

        if (ownersRes.success && ownersRes.data?.users) {
          setAvailableOwners(ownersRes.data.users);
        }
      } catch (err) {
        setApiError(err.message || 'Failed to load store information.');
      } finally {
        setLoadingInitial(false);
        setLoadingOwners(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
  };

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // 1. Name: 20-60 characters
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      errors.name = 'Store name is required';
    } else if (trimmedName.length < 20 || trimmedName.length > 60) {
      errors.name = `Store name must be between 20 and 60 characters (currently ${trimmedName.length})`;
    }

    // 2. Email: standard email validation
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      errors.email = 'Store email is required';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please provide a valid email address';
    }

    // 3. Address: maximum 400 characters
    const trimmedAddress = formData.address.trim();
    if (!trimmedAddress) {
      errors.address = 'Store address is required';
    } else if (trimmedAddress.length > 400) {
      errors.address = `Address cannot exceed 400 characters (currently ${trimmedAddress.length})`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSubErrors([]);

    if (!validate()) return;

    setLoading(true);
    try {
      await adminService.updateStore(id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        ownerId: formData.ownerId ? Number(formData.ownerId) : null
      });

      navigate('/admin/stores', { replace: true });
    } catch (err) {
      setApiError(err.message || 'Failed to update store details.');
      setSubErrors(err.errors || []);
    } finally {
      setLoading(false);
    }
  };

  if (loadingInitial) {
    return <LoadingSpinner message="Loading store data for editing..." />;
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => navigate('/admin/stores')}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.825rem' }}
        >
          <ArrowLeft size={14} /> Back to Stores
        </button>
      </div>

      <div className="page-header">
        <div>
          <div className="brand-badge" style={{ marginBottom: '0.5rem' }}>
            <Store size={14} /> Store Management
          </div>
          <h1 className="page-title">Edit Store #{id}</h1>
          <p className="page-subtitle">
            Update store information and assign or reassign its managing Store Owner
          </p>
        </div>
      </div>

      <div className="form-card" style={{ maxWidth: '680px', margin: '0 auto' }}>
        {apiError && <FormError message={apiError} errors={subErrors} type="danger" />}

        <form onSubmit={handleSubmit} noValidate>
          {/* Store Name */}
          <Input
            id="name"
            name="name"
            label="Store Name"
            value={formData.name}
            onChange={handleChange}
            error={formErrors.name}
            placeholder="e.g. Apex Organic Gourmet Supermarket"
            icon={Store}
            disabled={loading}
            required
            minLength={20}
            maxLength={60}
            showCharCount
            hint="Store name must be between 20 and 60 characters long."
          />

          {/* Contact Email */}
          <Input
            id="email"
            name="email"
            type="email"
            label="Store Contact Email"
            value={formData.email}
            onChange={handleChange}
            error={formErrors.email}
            placeholder="e.g. contact@apexorganic.com"
            icon={Mail}
            disabled={loading}
            required
            hint="Official store communication address."
          />

          {/* Physical Address */}
          <Input
            id="address"
            name="address"
            as="textarea"
            label="Store Address"
            value={formData.address}
            onChange={handleChange}
            error={formErrors.address}
            placeholder="Enter physical store address (up to 400 characters)..."
            icon={MapPin}
            disabled={loading}
            required
            maxLength={400}
            showCharCount
            rows={3}
          />

          {/* Store Owner Selector */}
          <div className="form-group">
            <label htmlFor="ownerId" className="form-label">
              <span>Assigned Store Owner</span>
              <span className="form-label-hint">1:N Relationship Supported</span>
            </label>

            <div className="input-wrapper">
              <div className="input-icon">
                <User size={18} />
              </div>

              <select
                id="ownerId"
                name="ownerId"
                value={formData.ownerId}
                onChange={handleChange}
                disabled={loading || loadingOwners}
                className="form-control has-left-icon"
              >
                <option value="">-- No Store Owner (Leave unassigned) --</option>
                {loadingOwners ? (
                  <option disabled>Loading store owners...</option>
                ) : availableOwners.length === 0 ? (
                  <option disabled>No store owners available</option>
                ) : (
                  availableOwners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.name} ({owner.email})
                      {owner.store_count > 0 ? ` [Manages ${owner.store_count} store${owner.store_count > 1 ? 's' : ''}]` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="input-feedback is-hint" style={{ marginTop: '0.25rem' }}>
              Select an existing Store Owner. Multiple stores can be assigned to the same owner.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <Button
              variant="secondary"
              onClick={() => navigate('/admin/stores')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              icon={Save}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEditStore;
