import React from 'react';
import SortHeader from './SortHeader';
import Pagination from './Pagination';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';

const DataTable = ({
  columns = [],
  data = [],
  loading = false,
  sortBy,
  sortOrder,
  onSort,
  pagination,
  emptyTitle = 'No records found',
  emptyDescription = 'There are currently no items matching your criteria.',
  emptyActionLabel,
  onEmptyAction,
  keyField = 'id',
  onRowClick,
  className = ''
}) => {
  return (
    <div className={`data-table-wrapper ${className}`}>
      <div className="table-responsive-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => {
                if (col.sortable) {
                  return (
                    <SortHeader
                      key={col.key}
                      field={col.key}
                      label={col.label}
                      currentSort={sortBy}
                      currentOrder={sortOrder}
                      onSort={onSort}
                      className={col.align ? `text-${col.align}` : ''}
                      style={col.width ? { width: col.width } : undefined}
                    />
                  );
                }

                return (
                  <th
                    key={col.key}
                    className={col.align ? `text-${col.align}` : ''}
                    style={col.width ? { width: col.width } : undefined}
                    scope="col"
                  >
                    {col.label}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: 0 }}>
                  <LoadingState rows={pagination?.pageSize || 5} cols={columns.length} />
                </td>
              </tr>
            ) : data && data.length > 0 ? (
              data.map((row, rowIdx) => (
                <tr
                  key={row[keyField] || `row-${rowIdx}`}
                  className={`table-row ${onRowClick ? 'clickable-row' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((col) => {
                    const value = row[col.key];
                    const content = col.render ? col.render(value, row, rowIdx) : (value ?? '—');

                    return (
                      <td
                        key={`${col.key}-${row[keyField] || rowIdx}`}
                        className={`table-cell ${col.align ? `text-${col.align}` : ''}`}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} style={{ padding: '2rem 1rem' }}>
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    actionLabel={emptyActionLabel}
                    onAction={onEmptyAction}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && pagination && pagination.totalItems > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
        />
      )}
    </div>
  );
};

export default DataTable;
