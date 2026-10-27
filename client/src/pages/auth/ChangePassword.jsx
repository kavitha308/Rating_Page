import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRoleRedirectPath } from '../../utils/navigation';
import PasswordInput from '../../components/common/PasswordInput';
import Button from '../../components/common/Button';
import FormError from '../../components/common/FormError';
import { KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';

const ChangePassword = () => {
  const { user, updatePassword } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [subErrors, setSubErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError('');
    if (successMessage) setSuccessMessage('');
  };

  const validate = () => {
    const errors = {};
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,16}$/;

    if (!formData.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (!passwordRegex.test(formData.newPassword)) {
      errors.newPassword = 'New password must be 8-16 characters with at least 1 uppercase and 1 special character';
    } else if (formData.newPassword === formData.currentPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    if (!formData.confirmNewPassword) {
      errors.confirmNewPassword = 'Please confirm your new password';
    } else if (formData.newPassword !== formData.confirmNewPassword) {
      errors.confirmNewPassword = 'New passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setSubErrors([]);
    setSuccessMessage('');

    if (!validate()) return;

    setLoading(true);
    try {
      const response = await updatePassword(formData.currentPassword, formData.newPassword);
      setSuccessMessage(response.message || 'Password changed successfully!');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    } catch (err) {
      setApiError(err.message || 'Failed to update password.');
      setSubErrors(err.errors || []);
    } finally {
      setLoading(false);
    }
  };

  const backDestination = user ? getRoleRedirectPath(user.role) : '/login';

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => navigate(backDestination)}
            className="btn btn-secondary"
            style={{ padding: '0.4rem 0.8rem', fontSize: '0.825rem' }}
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>

        <div className="auth-header" style={{ textAlign: 'left', marginBottom: '1.5rem' }}>
          <div className="brand-badge">
            <KeyRound size={16} />
            <span>Account Security</span>
          </div>
          <h1 className="auth-title" style={{ fontSize: '1.5rem' }}>Update Password</h1>
          <p className="auth-subtitle">Ensure your account uses a strong, unique password</p>
        </div>

        {successMessage && <FormError message={successMessage} type="success" />}
        {apiError && <FormError message={apiError} errors={subErrors} type="danger" />}

        <form onSubmit={handleSubmit} noValidate>
          <PasswordInput
            id="currentPassword"
            name="currentPassword"
            label="Current Password"
            placeholder="Enter current password"
            value={formData.currentPassword}
            onChange={handleChange}
            error={formErrors.currentPassword}
            disabled={loading}
            required
            autoComplete="current-password"
          />

          <PasswordInput
            id="newPassword"
            name="newPassword"
            label="New Password"
            hint="8-16 chars, 1 uppercase, 1 special"
            placeholder="Enter new password"
            value={formData.newPassword}
            onChange={handleChange}
            error={formErrors.newPassword}
            disabled={loading}
            required
            showRequirements
            autoComplete="new-password"
          />

          <PasswordInput
            id="confirmNewPassword"
            name="confirmNewPassword"
            label="Confirm New Password"
            placeholder="Re-enter new password"
            value={formData.confirmNewPassword}
            onChange={handleChange}
            error={formErrors.confirmNewPassword}
            disabled={loading}
            required
            autoComplete="new-password"
          />

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <Button
              type="submit"
              variant="primary"
              block
              loading={loading}
              icon={CheckCircle2}
            >
              Update Password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
