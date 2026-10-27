import { RotateCcw } from 'lucide-react';

const FilterPanel = ({
  filters = {},
  filterConfig = [],
  onFilterChange,
  onReset,
  children
}) => {
  const hasActiveFilters = Object.values(filters).some((val) => val !== '' && val !== null && val !== undefined);

  return (
    <div className="filter-panel">
      <div className="filter-controls-row">
        {filterConfig.map((cfg) => (
          <div key={cfg.key} className="filter-control-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {cfg.label && <label className="filter-item-label" style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{cfg.label}</label>}
            <select
              value={filters[cfg.key] || ''}
              onChange={(e) => onFilterChange(cfg.key, e.target.value)}
              className="filter-select-input"
              aria-label={cfg.label || 'Filter options'}
            >
              {cfg.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
        {children}
      </div>

      {hasActiveFilters && onReset && (
        <button type="button" className="filter-reset-btn" onClick={onReset} title="Reset filters">
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};

export default FilterPanel;
