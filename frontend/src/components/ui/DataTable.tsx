import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

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
      <div className="p-8 text-center rounded-xl bg-[#FBF7EF] border border-[#766B5B] text-xs text-[#5C4D44]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Version Table Desktop (>= 768 px) */}
      <div className="hidden md:block rounded-xl border border-[#766B5B] bg-[#FBF7EF] shadow-[0_2px_0_rgba(35,26,21,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs" aria-label={ariaLabel}>
            <thead>
              <tr className="bg-[#F2ECE1] border-b border-[#766B5B] text-[#231A15]">
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
                      className={`py-3 px-4 font-bold ${col.className || ''}`}
                    >
                      {col.sortable && onSort ? (
                        <button
                          type="button"
                          onClick={() => onSort(col.key)}
                          className="inline-flex items-center gap-1.5 hover:text-[#12304F] transition cursor-pointer font-bold focus-visible:outline-2 focus-visible:outline-[#F2B233] rounded px-1 -mx-1"
                        >
                          <span>{col.header}</span>
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#12304F]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[#12304F]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-[#5C4D44]/50" />
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
            <tbody className="divide-y divide-[#766B5B]/30">
              {data.map((row, index) => {
                const rowKey = keyExtractor(row);
                const isSelected = selectedId === rowKey;
                const isClickable = !!onRowClick;

                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick?.(row)}
                    className={`transition ${
                      isSelected
                        ? 'bg-[#F2ECE1] font-semibold'
                        : isClickable
                        ? 'hover:bg-[#F2ECE1]/60 cursor-pointer'
                        : 'hover:bg-[#F2ECE1]/30'
                    }`}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={`py-3 px-4 ${col.className || ''}`}>
                        {col.render
                          ? col.render(row, index)
                          : String((row as Record<string, any>)[col.key] ?? '')}
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

          // Fallback par défaut si renderMobileCard n'est pas fourni
          return (
            <div
              key={rowKey}
              onClick={() => onRowClick?.(row)}
              className={`p-4 rounded-xl border border-[#766B5B] bg-[#FBF7EF] shadow-sm space-y-2 text-xs ${
                onRowClick ? 'cursor-pointer active:bg-[#F2ECE1]' : ''
              }`}
            >
              {columns.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-[#5C4D44] shrink-0">{col.header} :</span>
                  <div className="text-right text-[#231A15]">
                    {col.render
                      ? col.render(row, index)
                      : String((row as Record<string, any>)[col.key] ?? '')}
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
