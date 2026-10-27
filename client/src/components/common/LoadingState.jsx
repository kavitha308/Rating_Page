import React from 'react';

const LoadingState = ({ rows = 5, cols = 4, message = 'Loading data...' }) => {
  return (
    <div className="table-loading-container" aria-busy="true" aria-label={message}>
      <div className="loading-pulse-header" />
      <div className="skeleton-table">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={`sk-row-${rIdx}`} className="skeleton-row">
            {Array.from({ length: cols }).map((_, cIdx) => (
              <div
                key={`sk-col-${cIdx}`}
                className="skeleton-cell"
                style={{
                  width: cIdx === 0 ? '30%' : cIdx === cols - 1 ? '15%' : '20%',
                  animationDelay: `${(rIdx * 0.1) + (cIdx * 0.05)}s`
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingState;
