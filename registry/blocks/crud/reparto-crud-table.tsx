"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/m8-ui/data-table";
import { DataTableColumnHeader } from "@/components/m8-ui/data-table-column-header";
import { StateLoading } from "@/components/m8-ui/state-loading";
import { StateEmpty } from "@/components/m8-ui/state-empty";
import { StateError } from "@/components/m8-ui/state-error";
import { Button } from "@/components/ui/button";

export interface RepartoCrudTableLabels {
  create: string;
  searchPlaceholder: string;
  loading: string;
  noResults: string;
  error: string;
  retry: string;
}

export interface RepartoCrudTableProps<T> {
  rows: T[];
  columns: ColumnDef<T>[];
  labels: RepartoCrudTableLabels;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onCreate?: () => void;
  page?: number;
  pageSize?: number;
  rowCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function RepartoCrudTable<T>({
  columns,
  error,
  labels,
  loading = false,
  onCreate,
  onPageSizeChange,
  onPageChange,
  onRetry,
  page = 1,
  pageSize,
  rowCount,
  rows
}: RepartoCrudTableProps<T>) {
  if (loading && rows.length === 0) {
    return (
      <div data-reparto-state="loading">
        <StateLoading title={labels.loading} />
      </div>
    );
  }
  if (error && rows.length === 0) {
    return (
      <div data-reparto-state="error">
        <StateError
          title={labels.error}
          description={error ?? undefined}
          retryLabel={labels.retry}
          onRetry={onRetry}
        />
      </div>
    );
  }
  return (
    <div data-reparto-table="crud" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {onCreate ? (
          <Button data-reparto-action="create" onClick={onCreate} type="button">
            {labels.create}
          </Button>
        ) : (
          <span />
        )}
      </div>
      <DataTable
        columns={columns}
        data={rows}
        labels={{
          empty: labels.noResults,
          loading: labels.loading,
          toolbar: { search: labels.searchPlaceholder }
        }}
        loading={loading}
        onPageChange={onPageChange ?? (() => undefined)}
        onPageSizeChange={onPageSizeChange ?? (() => undefined)}
        page={page}
        pageSize={pageSize ?? Math.max(rows.length, 1)}
        q=""
        rowCount={rowCount ?? rows.length}
      />
      {rows.length === 0 && !loading ? (
        <div data-reparto-state="empty">
          <StateEmpty title={labels.noResults} />
        </div>
      ) : null}
    </div>
  );
}

export type { ColumnDef } from "@tanstack/react-table";
export { DataTableColumnHeader };
