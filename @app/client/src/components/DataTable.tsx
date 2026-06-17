import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type OnChangeFn,
  type RowSelectionState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Checkbox } from "@/components/ui/Checkbox.tsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";

/* eslint-disable react-refresh/only-export-components */
export const columnSelect = <TData,>(): ColumnDef<TData, any> => ({
  id: "select",
  header: ({ table }) => (
    <Checkbox
      checked={
        table.getIsAllPageRowsSelected() ||
        (table.getIsSomePageRowsSelected() && "indeterminate")
      }
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label="Select all"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label="Select row"
    />
  ),
  enableSorting: false,
  enableHiding: false,
});

export interface DataTableProps<TData, TValue> {
  getRowId?: (originalRow: TData, index: number) => string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  labelNoResults?: string;
}

export function DataTable<TData, TValue>({
  getRowId,
  columns,
  data,
  onRowSelectionChange,
  labelNoResults,
}: DataTableProps<TData, TValue>) {
  const { t } = useTranslation(["common"]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const handleRowSelectionChange: OnChangeFn<RowSelectionState> = (updater) => {
    setRowSelection(updater);
    if (onRowSelectionChange) {
      onRowSelectionChange(updater);
    }
  };
  const table = useReactTable({
    getRowId,
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: onRowSelectionChange
      ? handleRowSelectionChange
      : undefined,
    state: {
      rowSelection,
    },
  });

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {labelNoResults || t("common:no_results")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
