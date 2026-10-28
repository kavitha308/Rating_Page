import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import PasswordInput from '../../components/common/PasswordInput';
import Button from '../../components/common/Button';
import FormError from '../../components/common/FormError';
import { User, Mail, MapPin, CheckCircle, ArrowRight } from 'lucide-react';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [subErrors, setSubErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

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
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,16}$/;

    // 1. Name: 20-60 characters
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      errors.name = 'Full name is required';
    } else if (trimmedName.length < 20 || trimmedName.length > 60) {
      errors.name = `Name must be between 20 and 60 characters (currently ${trimmedName.length} characters)`;
    }

    // 2. Email: standard email validation
    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    // 3. Address: maximum 400 characters
    const trimmedAddress = formData.address.trim();
    if (!trimmedAddress) {
      errors.address = 'Physical address is required';
    } else if (trimmedAddress.length > 400) {
      errors.address = `Address cannot exceed 400 characters (currently ${trimmedAddress.length} characters)`;
    }

    // 4. Password: 8-16 characters, 1 uppercase, 1 special character
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!passwordRegex.test(formData.password)) {
      errors.password = 'Password must be 8-16 characters with at least 1 uppercase and 1 special character';
    }

    // 5. Confirm Password: must match
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      const response = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        password: formData.password
      });

      if (typeof response === 'string' && (response.includes('<!DOCTYPE') || response.includes('<html'))) {
        throw new Error('API connection error: Received HTML page instead of API response. Please set VITE_API_BASE_URL.');
      }

      setRegistrationSuccess(true);
    } catch (err) {
      setApiError(err.message || 'Registration failed. Please review your details.');
      setSubErrors(err.errors || []);
    } finally {
      setLoading(false);
    }
  };

  if (registrationSuccess) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: 'var(--success-light)',
              color: 'var(--success)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem auto'
            }}
          >
            <CheckCircle size={32} />
          </div>
          <h2 className="auth-title">Registration Successful!</h2>
          <p className="auth-subtitle" style={{ marginBottom: '1.5rem' }}>
            Your normal user account has been registered. You can now log in to browse stores and submit reviews.
          </p>
          <Button
            type="button"
            variant="primary"
            block
            icon={ArrowRight}
            onClick={() => navigate('/login')}
          >
            Proceed to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-badge">
            <User size={16} />
            <span>Normal User Registration</span>
          </div>
          <h1 className="auth-title">Create an Account</h1>
          <p className="auth-subtitle">Join the platform to rate stores and share authentic feedback</p>
        </div>

        {apiError && <FormError message={apiError} errors={subErrors} type="danger" />}

        <form onSubmit={handleSubmit} noValidate>
          <Input
            id="name"
            name="name"
            type="text"
            label="Full Name"
            hint="Min 20, Max 60 characters"
            placeholder="e.g. Jonathan Edward Higginsworth"
            value={formData.name}
            onChange={handleChange}
            error={formErrors.name}
            icon={User}
            disabled={loading}
            required
            maxLength={60}
            showCharCount
          />

          <Input
            id="email"
            name="email"
            type="email"
            label="Email Address"
            placeholder="name@example.com"
            value={formData.email}
            onChange={handleChange}
            error={formErrors.email}
            icon={Mail}
            disabled={loading}
            required
            autoComplete="email"
          />

          <Input
            id="address"
            name="address"
            as="textarea"
            label="Address"
            hint="Max 400 characters"
            placeholder="Enter physical address, street, apartment, and city"
            value={formData.address}
            onChange={handleChange}
            error={formErrors.address}
            icon={MapPin}
            disabled={loading}
            required
            maxLength={400}
            showCharCount
            rows={2}
          />

          <PasswordInput
            id="password"
            name="password"
            label="Password"
            hint="8-16 chars, 1 uppercase, 1 special"
            placeholder="Create a strong password"
            value={formData.password}
            onChange={handleChange}
            error={formErrors.password}
            disabled={loading}
            required
            showRequirements
          />

          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Re-enter password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={formErrors.confirmPassword}
            disabled={loading}
            required
          />

          <div style={{ marginTop: '1.5rem' }}>
            <Button
              type="submit"
              variant="primary"
              block
              loading={loading}
              icon={ArrowRight}
            >
              Register Account
            </Button>
          </div>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
