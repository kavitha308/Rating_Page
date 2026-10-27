import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

const SortHeader = ({
  field,
  label,
  currentSort,
  currentOrder = 'ASC',
  onSort,
  className = ''
}) => {
  const isSorted = currentSort === field;

  const handleClick = () => {
    if (!onSort) return;
    if (isSorted) {
      // Toggle sort order
      onSort(field, currentOrder === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // New sort column defaults to ASC
      onSort(field, 'ASC');
    }
  };

  return (
    <th
      className={`sortable-th ${isSorted ? 'is-active-sort' : ''} ${className}`}
      onClick={handleClick}
      scope="col"
      tabIndex={0}
      role="button"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-sort={isSorted ? (currentOrder === 'ASC' ? 'ascending' : 'descending') : 'none'}
    >
      <div className="sort-th-content">
        <span>{label}</span>
        <span className="sort-icon-box">
          {isSorted ? (
            currentOrder === 'ASC' ? (
              <ArrowUp size={14} className="sort-icon active" />
            ) : (
              <ArrowDown size={14} className="sort-icon active" />
            )
          ) : (
            <ArrowUpDown size={14} className="sort-icon neutral" />
          )}
        </span>
      </div>
    </th>
  );
};

export default SortHeader;
