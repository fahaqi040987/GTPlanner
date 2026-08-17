import React from 'react';

/**
 * DesignStitch DataTable component
 * Material Design table with hover states and pagination
 */
const DataTable = ({
  columns,
  data,
  onRowClick = null,
  pagination = null,
  loading = false
}) => {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant
                    rounded-xl overflow-hidden shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.02)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`py-md px-lg text-label-caps font-label-caps
                              text-on-surface-variant ${column.width || ''}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-xl">
                  <div className="inline-block w-6 h-6 border-2 border-secondary
                                border-t-transparent rounded-full animate-spin"></div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="text-center py-xl text-on-surface-variant">
                  No documents found
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`hover:bg-surface-container-low/50 transition-colors
                              group ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="py-md px-lg text-body-sm font-body-sm text-on-surface"
                    >
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && (
        <div className="bg-surface px-lg py-md border-t border-outline-variant
                        flex items-center justify-between">
          <span className="text-label-caps font-label-caps text-outline">
            {pagination.label}
          </span>
          <div className="flex gap-sm">
            <button
              className="px-sm py-xs border border-outline-variant rounded
                         hover:bg-surface-container-low transition-colors disabled:opacity-50"
              disabled={pagination.onPrev === null}
              onClick={pagination.onPrev}
            >
              Prev
            </button>
            <button
              className="px-sm py-xs border border-outline-variant rounded
                         hover:bg-surface-container-low transition-colors disabled:opacity-50 text-primary"
              disabled={pagination.onNext === null}
              onClick={pagination.onNext}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
