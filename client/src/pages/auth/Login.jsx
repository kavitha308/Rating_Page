import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import PasswordInput from '../../components/common/PasswordInput';
import Button from '../../components/common/Button';
import FormError from '../../components/common/FormError';
import { Mail, ArrowRight, ShieldCheck } from 'lucide-react';

const Login = () => {
  const { login, getRoleRedirectPath, sessionExpiredMessage, clearSessionMessage } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [subErrors, setSubErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
    if (sessionExpiredMessage) clearSessionMessage();
  };

  const validate = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      errors.password = 'Password is required';
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
      const authenticatedUser = await login(formData.email.trim(), formData.password);

      // Check if user came from a protected route
      const destination = location.state?.from?.pathname || getRoleRedirectPath(authenticatedUser.role);
      navigate(destination, { replace: true });
    } catch (err) {
      setApiError(err.message || 'Login failed. Please check your credentials.');
      setSubErrors(err.errors || []);
    } finally {
      setLoading(false);
    }
  };

  // Helper to prefill test credentials for testing
  const fillCredentials = (email, password) => {
    setFormData({ email, password });
    setFormErrors({});
    setApiError('');
    if (sessionExpiredMessage) clearSessionMessage();
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-badge">
            <ShieldCheck size={16} />
            <span>Secure Authentication</span>
          </div>
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Log in with your platform credentials to continue</p>
        </div>

        {sessionExpiredMessage && (
          <FormError message={sessionExpiredMessage} type="danger" />
        )}

        {apiError && <FormError message={apiError} errors={subErrors} type="danger" />}

        <form onSubmit={handleSubmit} noValidate>
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
            autoFocus
          />

          <PasswordInput
            id="password"
            name="password"
            label="Password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            error={formErrors.password}
            disabled={loading}
            required
            autoComplete="current-password"
          />

          <div style={{ marginTop: '1.5rem' }}>
            <Button
              type="submit"
              variant="primary"
              block
              loading={loading}
              icon={ArrowRight}
            >
              Sign In
            </Button>
          </div>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>
            Create an account
          </Link>
        </div>

        {/* Demo Credentials Quick-Fill Cheat Sheet */}
        <div className="demo-credentials-box">
          <div className="demo-title">
            <ShieldCheck size={14} /> Quick Demo Logins:
          </div>
          <div className="demo-item">
            <span>Admin:</span>
            <button
              type="button"
              className="demo-fill-btn"
              onClick={() => fillCredentials('admin@storerating.com', 'Admin@1234')}
            >
              Use Admin (admin@storerating.com)
            </button>
          </div>
          <div className="demo-item">
            <span>Store Owner:</span>
            <button
              type="button"
              className="demo-fill-btn"
              onClick={() => fillCredentials('harrington@storerating.com', 'Owner@1234')}
            >
              Use Owner (harrington@storerating.com)
            </button>
          </div>
          <div className="demo-item">
            <span>Normal User:</span>
            <button
              type="button"
              className="demo-fill-btn"
              onClick={() => fillCredentials('jonathan.higgins@example.com', 'User@1234')}
            >
              Use User (jonathan.higgins@example.com)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
