import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  searchPlaceholder?: string;
  searchKeys?: (keyof T | string)[];
  customSearchFilter?: (item: T, query: string) => boolean;
  itemsPerPageOptions?: number[];
  defaultItemsPerPage?: number;
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectionChange?: (selectedIds: (string | number)[]) => void;
  bulkActions?: React.ReactNode;
  filterComponent?: React.ReactNode;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  loading?: boolean;
  actionsHeader?: string;
  renderActions?: (item: T) => React.ReactNode;
}

// Helper to safely extract nested object paths (e.g. 'user.first_name')
const getNestedValue = (obj: any, path: string): any => {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
};

// Helper for deep recursive search within nested objects & arrays
const deepSearchMatch = (val: any, query: string, depth = 3): boolean => {
  if (val === null || val === undefined) return false;
  if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
    return String(val).toLowerCase().includes(query);
  }
  if (depth <= 0) return false;
  if (Array.isArray(val)) {
    return val.some((item) => deepSearchMatch(item, query, depth - 1));
  }
  if (typeof val === 'object') {
    return Object.values(val).some((item) => deepSearchMatch(item, query, depth - 1));
  }
  return false;
};

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Search records...',
  searchKeys,
  customSearchFilter,
  itemsPerPageOptions = [10, 25, 50, 100],
  defaultItemsPerPage = 10,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
  bulkActions,
  filterComponent,
  emptyMessage = 'No records found matching criteria.',
  emptyIcon,
  loading = false,
  actionsHeader = 'Actions',
  renderActions,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(defaultItemsPerPage);

  // Filter Data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const query = searchTerm.toLowerCase().trim();

    return data.filter((item) => {
      // 1. If explicit customSearchFilter function is provided, prioritize it
      if (customSearchFilter) {
        return customSearchFilter(item, query);
      }

      // 2. If explicit searchKeys provided, evaluate direct and nested keys
      if (searchKeys && searchKeys.length > 0) {
        return searchKeys.some((key) => {
          const val = getNestedValue(item, String(key));
          return val !== null && val !== undefined && String(val).toLowerCase().includes(query);
        });
      }

      // 3. Fallback: deep search across all properties including nested objects
      return deepSearchMatch(item, query);
    });
  }, [data, searchTerm, searchKeys, customSearchFilter]);

  // Sort Data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const isAllSelected =
    paginatedData.length > 0 &&
    paginatedData.every((item) => selectedIds.includes(keyExtractor(item)));

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      const pageKeys = paginatedData.map((item) => keyExtractor(item));
      onSelectionChange(selectedIds.filter((id) => !pageKeys.includes(id)));
    } else {
      const pageKeys = paginatedData.map((item) => keyExtractor(item));
      const combined = Array.from(new Set([...selectedIds, ...pageKeys]));
      onSelectionChange(combined);
    }
  };

  const handleSelectRow = (id: string | number) => {
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Top Bar: Search, Filters & Bulk Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={searchPlaceholder}
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-[#F1BCCE] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#D84B7E] focus:border-[#D84B7E]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {filterComponent}
          {selectable && selectedIds.length > 0 && bulkActions && (
            <div className="flex items-center gap-2 p-1 bg-[#FCE7F0] border border-[#F1BCCE] rounded-xl px-3 py-1.5 animate-fadeIn">
              <span className="text-[11px] font-bold text-[#D84B7E]">
                {selectedIds.length} selected
              </span>
              {bulkActions}
            </div>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-[#F1BCCE]/70 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto min-h-[220px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF0F4] border-b border-[#F1BCCE]/70 text-[#111111] font-semibold select-none">
                {selectable && (
                  <th className="p-3.5 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="rounded text-[#D84B7E] focus:ring-[#D84B7E] border-gray-300 w-4 h-4 cursor-pointer accent-[#D84B7E]"
                    />
                  </th>
                )}

                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                    className={`p-3.5 uppercase tracking-wider text-[10px] text-gray-600 font-bold ${
                      col.sortable !== false ? 'cursor-pointer hover:text-[#D84B7E]' : ''
                    } ${col.className || ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable !== false && (
                        <span>
                          {sortKey === col.key ? (
                            sortDirection === 'asc' ? (
                              <ChevronUp className="w-3 h-3 text-[#D84B7E]" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-[#D84B7E]" />
                            )
                          ) : (
                            <ChevronsUpDown className="w-3 h-3 text-gray-500 opacity-60" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                ))}

                {renderActions && (
                  <th className="p-3.5 uppercase tracking-wider text-[10px] text-gray-600 font-bold text-right pr-4">
                    {actionsHeader}
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-[#F1BCCE]/40">
              {loading ? (
                Array.from({ length: itemsPerPage }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {selectable && <td className="p-3.5"><div className="w-4 h-4 bg-gray-200 rounded" /></td>}
                    {columns.map((col) => (
                      <td key={col.key} className="p-3.5">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                      </td>
                    ))}
                    {renderActions && (
                      <td className="p-3.5 text-right">
                        <div className="h-6 bg-gray-200 rounded w-16 ml-auto" />
                      </td>
                    )}
                  </tr>
                ))
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 1 : 0) + (renderActions ? 1 : 0)}
                    className="p-12 text-center text-gray-600"
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      {emptyIcon || <Filter className="w-8 h-8 text-gray-500 stroke-[1.5]" />}
                      <p className="text-xs font-medium">{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((item) => {
                  const id = keyExtractor(item);
                  const isSelected = selectedIds.includes(id);

                  return (
                    <tr
                      key={id}
                      className={`hover:bg-[#FDF4F7]/70 transition-colors ${
                        isSelected ? 'bg-[#FCE7F0]/40' : ''
                      }`}
                    >
                      {selectable && (
                        <td className="p-3.5 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(id)}
                            className="rounded text-[#D84B7E] focus:ring-[#D84B7E] border-gray-300 w-4 h-4 cursor-pointer accent-[#D84B7E]"
                          />
                        </td>
                      )}

                      {columns.map((col) => (
                        <td key={col.key} className={`p-3.5 ${col.className || ''}`}>
                          {col.render ? col.render(item) : item[col.key]}
                        </td>
                      ))}

                      {renderActions && (
                        <td className="p-3.5 text-right pr-4 whitespace-nowrap">
                          {renderActions(item)}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination */}
        <div className="p-3.5 border-t border-[#F1BCCE]/60 bg-[#FAF0F4]/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-[#F1BCCE] rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#D84B7E]"
            >
              {itemsPerPageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span>of {sortedData.length} records</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#F1BCCE] bg-white hover:bg-[#FCE7F0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
