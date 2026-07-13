"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/m8-ui/data-table";
import { DataTableColumnHeader } from "@/components/m8-ui/data-table-column-header";

import type { AssignmentProcessPublic } from "@mano8/astro-reparto-m8/schemas";

export interface RepartoProcessesTableLabels {
  academicYear: string;
  department: string;
  status: string;
  created: string;
  noResults: string;
  searchPlaceholder: string;
  loading: string;
}

const DEFAULT_LABELS: RepartoProcessesTableLabels = {
  academicYear: "Academic year",
  department: "Department",
  status: "Status",
  created: "Created",
  noResults: "No reparto processes found.",
  searchPlaceholder: "Filter processes...",
  loading: "Loading reparto processes..."
};

export interface RepartoProcessesTableProps {
  processes: AssignmentProcessPublic[];
  loading?: boolean;
  labels?: Partial<RepartoProcessesTableLabels>;
  page?: number;
  pageSize?: number;
  rowCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

function formatStatus(status: AssignmentProcessPublic["status"]) {
  return status.replaceAll("_", " ");
}

export function buildRepartoProcessColumns(
  labels: RepartoProcessesTableLabels
): ColumnDef<AssignmentProcessPublic>[] {
  return [
    {
      accessorKey: "academic_year_id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.academicYear} />
      )
    },
    {
      accessorKey: "department_id",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.department} />
      )
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.status} />
      ),
      cell: ({ row }) => (
        <Badge variant="outline" className="capitalize">
          {formatStatus(row.original.status)}
        </Badge>
      )
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={labels.created} />
      ),
      cell: ({ row }) => (
        <time dateTime={row.original.created_at}>{row.original.created_at}</time>
      )
    }
  ];
}

export function RepartoProcessesTable({
  labels,
  loading = false,
  onPageChange,
  onPageSizeChange,
  page = 1,
  pageSize,
  processes,
  rowCount
}: RepartoProcessesTableProps) {
  const resolvedLabels = { ...DEFAULT_LABELS, ...labels };
  const resolvedPageSize = pageSize ?? Math.max(processes.length, 1);
  return (
    <DataTable
      columns={buildRepartoProcessColumns(resolvedLabels)}
      data={processes}
      labels={{
        empty: resolvedLabels.noResults,
        loading: resolvedLabels.loading,
        toolbar: {
          search: resolvedLabels.searchPlaceholder
        }
      }}
      loading={loading}
      onPageChange={onPageChange ?? (() => undefined)}
      onPageSizeChange={onPageSizeChange ?? (() => undefined)}
      page={page}
      pageSize={resolvedPageSize}
      q=""
      rowCount={rowCount ?? processes.length}
    />
  );
}

export default RepartoProcessesTable;
