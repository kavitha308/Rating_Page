import React from 'react';

const LoadingSpinner = ({ message = 'Loading...', fullScreen = false }) => {
  const content = (
    <div className="loading-container">
      <div className="spinner spinner-primary" role="status" aria-label="Loading" />
      {message && <p style={{ fontSize: '0.925rem', fontWeight: 500 }}>{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}
      >
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
