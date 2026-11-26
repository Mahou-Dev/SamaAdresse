import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T) => string;
  sortKey?: string | null;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (key: string) => void;
  renderMobileCard?: (row: T, index: number) => React.ReactNode;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  selectedId?: string | null;
  ariaLabel?: string;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  sortKey,
  sortDirection,
  onSort,
  renderMobileCard,
  emptyMessage = 'Aucune donnée disponible',
  onRowClick,
  selectedId,
  ariaLabel = 'Tableau de données',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="p-8 text-center rounded-2xl bg-surface-elevated border border-border text-sm text-ink-muted">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Version Table Desktop (>= 768 px) */}
      <div className="hidden md:block rounded-2xl border border-border bg-surface-elevated shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm" aria-label={ariaLabel}>
            <thead>
              <tr className="bg-surface border-b border-border text-ink-secondary">
                {columns.map((col) => {
                  const isSorted = sortKey === col.key;
                  const sortAria = !col.sortable
                    ? undefined
                    : isSorted
                    ? sortDirection === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : 'none';

                  return (
                    <th
                      key={col.key}
                      scope="col"
                      aria-sort={sortAria}
                      className={cn('py-3.5 px-4 text-xs font-semibold uppercase tracking-wide', col.className)}
                    >
                      {col.sortable && onSort ? (
                        <button
                          type="button"
                          onClick={() => onSort(col.key)}
                          className="inline-flex items-center gap-1.5 hover:text-ink transition cursor-pointer font-semibold uppercase tracking-wide focus-visible:outline-2 focus-visible:outline-institution rounded px-1 -mx-1"
                        >
                          <span>{col.header}</span>
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-institution" aria-hidden="true" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-institution" aria-hidden="true" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-ink-subtle" aria-hidden="true" />
                          )}
                        </button>
                      ) : (
                        <span>{col.header}</span>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((row, index) => {
                const rowKey = keyExtractor(row);
                const isSelected = selectedId === rowKey;
                const isClickable = Boolean(onRowClick);

                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'transition-colors',
                      isSelected
                        ? 'bg-institution-soft/70 font-medium'
                        : isClickable
                        ? 'hover:bg-surface cursor-pointer'
                        : 'hover:bg-surface/60'
                    )}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={cn('py-3.5 px-4 text-ink-secondary', col.className)}>
                        {col.render
                          ? col.render(row, index)
                          : String((row as Record<string, unknown>)[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Version Cartes Mobile (< 768 px) */}
      <div className="md:hidden space-y-3">
        {data.map((row, index) => {
          const rowKey = keyExtractor(row);
          if (renderMobileCard) {
            return (
              <div key={rowKey} onClick={() => onRowClick?.(row)}>
                {renderMobileCard(row, index)}
              </div>
            );
          }

          return (
            <div
              key={rowKey}
              onClick={() => onRowClick?.(row)}
              className={cn(
                'p-4 rounded-2xl border border-border bg-surface-elevated shadow-xs space-y-2 text-xs',
                onRowClick && 'cursor-pointer active:bg-surface'
              )}
            >
              {columns.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-ink-muted shrink-0">{col.header} :</span>
                  <div className="text-right text-ink">
                    {col.render
                      ? col.render(row, index)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
