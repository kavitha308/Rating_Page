import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import FormError from '../../components/common/FormError';
import { Store, Mail, MapPin, User, ArrowLeft, PlusCircle } from 'lucide-react';

const AdminCreateStore = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    ownerId: ''
  });

  const [availableOwners, setAvailableOwners] = useState([]);
  const [loadingOwners, setLoadingOwners] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [subErrors, setSubErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch list of store owners to populate dropdown
  useEffect(() => {
    const fetchStoreOwners = async () => {
      setLoadingOwners(true);
      try {
        const response = await adminService.getUsers({ role: 'STORE_OWNER', limit: 100 });
        if (response.success && response.data?.users) {
          setAvailableOwners(response.data.users);
        }
      } catch (err) {
        console.error('Error fetching store owners:', err);
      } finally {
        setLoadingOwners(false);
      }
    };

    fetchStoreOwners();
  }, []);

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
      await adminService.createStore({
        name: formData.name.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        ownerId: formData.ownerId ? Number(formData.ownerId) : null
      });

      navigate('/admin/stores', { replace: true });
    } catch (err) {
      setApiError(err.message || 'Failed to create store listing.');
      setSubErrors(err.errors || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: 680 }}>
      <div style={{ marginBottom: '1.25rem' }}>
        <button
          type="button"
          onClick={() => navigate('/admin/stores')}
          className="btn btn-secondary"
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.825rem' }}
        >
          <ArrowLeft size={14} /> Back to Stores List
        </button>
      </div>

      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div className="brand-badge" style={{ marginBottom: '0.5rem' }}>
            <PlusCircle size={14} /> Store Onboarding
          </div>
          <h1 className="page-title">Add New Store</h1>
          <p className="page-subtitle">
            Register a merchant location and optionally assign a certified Store Owner
          </p>
        </div>
      </div>

      <div className="auth-card" style={{ maxWidth: '100%', margin: 0 }}>
        {apiError && <FormError message={apiError} errors={subErrors} type="danger" />}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="name"
            name="name"
            label="Store Name"
            hint="Min 20, Max 60 characters"
            placeholder="e.g. Apex Organic Gourmet Supermarket"
            value={formData.name}
            onChange={handleChange}
            error={formErrors.name}
            icon={Store}
            disabled={loading}
            required
            maxLength={60}
            showCharCount
          />

          <Input
            id="email"
            name="email"
            type="email"
            label="Store Contact Email"
            placeholder="contact@storename.com"
            value={formData.email}
            onChange={handleChange}
            error={formErrors.email}
            icon={Mail}
            disabled={loading}
            required
          />

          <Input
            id="address"
            name="address"
            as="textarea"
            label="Physical Store Address"
            hint="Max 400 characters"
            placeholder="Enter full physical address, street, unit, district, and city"
            value={formData.address}
            onChange={handleChange}
            error={formErrors.address}
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
              <span>Assign Store Owner</span>
              <span className="form-label-hint">Optional (1:1 Relationship)</span>
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
                {availableOwners.map((owner) => {
                  const isAssigned = Boolean(owner.store);
                  return (
                    <option
                      key={owner.id}
                      value={owner.id}
                      disabled={isAssigned}
                    >
                      {owner.name} ({owner.email}) {isAssigned ? `— [Already managing: ${owner.store.name}]` : '— [Available]'}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="input-feedback is-hint" style={{ marginTop: '0.25rem' }}>
              Only users with role STORE_OWNER who are not yet managing a store can be assigned.
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
              icon={PlusCircle}
            >
              Save & Register Store
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminCreateStore;
