"use client";

import { useMemo, useState, type ReactNode } from "react";
import { normalizeListParams } from "@mano8/astro-ui-m8";

import { repartoButtonClass, repartoInputClass } from "../styles.js";

export type DataTableSortDirection = "asc" | "desc";
export type DataTableColumn<T> = {
  id: string;
  label: string;
  value: (row: T) => string | number;
  cell?: (row: T) => ReactNode;
  hideable?: boolean;
  sortable?: boolean;
};
export type DataTableLabels = {
  columns: string;
  filter: string;
  firstPage: string;
  lastPage: string;
  nextPage: string;
  page: (current: number, total: number) => string;
  previousPage: string;
  rowsPerPage: string;
  search: string;
};
type DataTableProps<T> = {
  addButton?: ReactNode;
  columns: DataTableColumn<T>[];
  data: T[];
  emptyLabel: string;
  filter?: { label: string; options: string[]; value: (row: T) => string };
  labels: DataTableLabels;
  rowAttributes?: (row: T) => Record<string, string>;
  rowKey: (row: T) => string;
  rowName: string;
  searchFields: ((row: T) => string)[];
  tableName: string;
};
type ValueChangeEvent = { target: { value: string } };
type CheckedChangeEvent = { target: { checked: boolean } };

function compareValues(left: string | number, right: string | number) {
  if (typeof left === "number" && typeof right === "number") return left - right;
  return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: "base" });
}

export function DataTable<T>({
  addButton, columns, data, emptyLabel, filter, labels, rowAttributes, rowKey, rowName, searchFields, tableName
}: DataTableProps<T>) {
  const firstSortableColumn = columns.find((column) => column.sortable !== false);
  const [query, setQuery] = useState("");
  const [filterValue, setFilterValue] = useState("");
  const [sortBy, setSortBy] = useState(firstSortableColumn?.id ?? "");
  const [sortDirection, setSortDirection] = useState<DataTableSortDirection>("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => new Set());

  const visibleColumns = columns.filter((column) => !hiddenColumns.has(column.id));
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredRows = useMemo(() => {
    const matching = data.filter((row) => {
      const matchesQuery = !normalizedQuery || searchFields.some(
        (field) => field(row).toLocaleLowerCase().includes(normalizedQuery)
      );
      return matchesQuery && (!filterValue || filter?.value(row) === filterValue);
    });
    const column = columns.find((candidate) => candidate.id === sortBy);
    if (!column) return matching;
    const direction = sortDirection === "asc" ? 1 : -1;
    return [...matching].sort(
      (left, right) => compareValues(column.value(left), column.value(right)) * direction
    );
  }, [columns, data, filter, filterValue, normalizedQuery, searchFields, sortBy, sortDirection]);

  const normalized = normalizeListParams({ page, pageSize }, { defaultPageSize: 10, maxPageSize: 100 });
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / normalized.pageSize));
  const currentPage = Math.min(normalized.page, pageCount);
  const pageRows = filteredRows.slice(
    (currentPage - 1) * normalized.pageSize,
    currentPage * normalized.pageSize
  );
  const resetPage = () => setPage(1);
  const toggleSort = (column: DataTableColumn<T>) => {
    if (column.sortable === false) return;
    if (sortBy === column.id) setSortDirection((current) => current === "asc" ? "desc" : "asc");
    else { setSortBy(column.id); setSortDirection("asc"); }
    resetPage();
  };
  const pagination = (position: "top" | "bottom") => (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm" data-reparto-pagination={position}>
      <label className="flex items-center gap-2">
        <span>{labels.rowsPerPage}</span>
        <select aria-label={labels.rowsPerPage} className={repartoInputClass} onChange={(event: ValueChangeEvent) => { setPageSize(Number(event.target.value)); resetPage(); }} value={pageSize}>
          {[5, 10, 20, 50].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
      </label>
      <span data-reparto-page-indicator="">{labels.page(currentPage, pageCount)}</span>
      <div className="flex items-center gap-2">
        <button aria-label={labels.firstPage} className={repartoButtonClass} disabled={currentPage === 1} onClick={() => setPage(1)} type="button">«</button>
        <button aria-label={labels.previousPage} className={repartoButtonClass} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} type="button">‹</button>
        <button aria-label={labels.nextPage} className={repartoButtonClass} disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} type="button">›</button>
        <button aria-label={labels.lastPage} className={repartoButtonClass} disabled={currentPage === pageCount} onClick={() => setPage(pageCount)} type="button">»</button>
      </div>
    </div>
  );

  return (
    <div className="space-y-3" data-reparto-data-table="shared-registry" data-reparto-table={tableName}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <input aria-label={labels.search} className={`${repartoInputClass} min-w-56`} onChange={(event: ValueChangeEvent) => { setQuery(event.target.value); resetPage(); }} placeholder={labels.search} type="search" value={query} />
          {filter ? (
            <label className="flex items-center gap-2">
              <span>{filter.label}</span>
              <select aria-label={filter.label} className={repartoInputClass} onChange={(event: ValueChangeEvent) => { setFilterValue(event.target.value); resetPage(); }} value={filterValue}>
                <option value="">{labels.filter}</option>
                {filter.options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <details className="relative">
            <summary className={`${repartoButtonClass} cursor-pointer list-none`}>{labels.columns}</summary>
            <div className="absolute right-0 z-10 mt-1 grid min-w-44 gap-2 rounded-md border bg-card p-3 shadow-md">
              {columns.filter((column) => column.hideable !== false).map((column) => (
                <label className="flex items-center gap-2" key={column.id}>
                  <input checked={!hiddenColumns.has(column.id)} onChange={(event: CheckedChangeEvent) => setHiddenColumns((current) => {
                    const next = new Set(current);
                    if (event.target.checked) next.delete(column.id); else next.add(column.id);
                    return next;
                  })} type="checkbox" />
                  {column.label}
                </label>
              ))}
            </div>
          </details>
          {addButton}
        </div>
      </div>
      {pagination("top")}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full border-collapse text-sm">
          <thead><tr className="border-b bg-muted/40">
            {visibleColumns.map((column) => (
              <th className="px-3 py-2 text-left font-medium" key={column.id}>
                {column.sortable === false ? column.label : (
                  <button className="inline-flex items-center gap-1" data-reparto-sort-column={column.id} onClick={() => toggleSort(column)} type="button">
                    {column.label}{sortBy === column.id ? (sortDirection === "asc" ? " ↑" : " ↓") : " ↕"}
                  </button>
                )}
              </th>
            ))}
          </tr></thead>
          <tbody>
            {pageRows.length ? pageRows.map((row) => (
              <tr className="border-b last:border-0" data-reparto-row={rowName} key={rowKey(row)} {...(rowAttributes?.(row) ?? {})}>
                {visibleColumns.map((column) => <td className="px-3 py-2" key={column.id}>{column.cell?.(row) ?? column.value(row)}</td>)}
              </tr>
            )) : <tr><td className="h-24 px-3 text-center" colSpan={Math.max(visibleColumns.length, 1)} data-reparto-state="empty">{emptyLabel}</td></tr>}
          </tbody>
        </table>
      </div>
      {pagination("bottom")}
    </div>
  );
}
