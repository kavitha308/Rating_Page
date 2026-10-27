import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const FormError = ({ message, errors = [], type = 'danger' }) => {
  if (!message && (!errors || errors.length === 0)) {
    return null;
  }

  const isSuccess = type === 'success';

  return (
    <div className={`alert ${isSuccess ? 'alert-success' : 'alert-danger'}`} role="alert">
      <div className="alert-icon">
        {isSuccess ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      </div>
      <div className="alert-content">
        {message && <div style={{ fontWeight: 600 }}>{message}</div>}
        {errors && errors.length > 0 && (
          <ul className="alert-errors-list">
            {errors.map((err, idx) => (
              <li key={idx}>
                {typeof err === 'string' ? err : err.message || `${err.field}: Invalid value`}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FormError;
