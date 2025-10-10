"use client";

import {
  getPaginationRowModel,
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { decryptKey } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [isLoading, setIsLoading] = useState(true); 
  const encryptedKey =
    typeof window !== "undefined"
      ? window.localStorage.getItem("accessKey")
      : null;

  useEffect(() => {
    const accessKey = encryptedKey && decryptKey(encryptedKey);

    if (accessKey !== process.env.NEXT_PUBLIC_ADMIN_PASSKEY!.toString()) {
      redirect("/");
    }
    // Simulate data loading completion
    setTimeout(() => setIsLoading(false), 500);
  }, [encryptedKey]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 5,
      },
    },
  });

  // Loading Skeleton Component
  const LoadingSkeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="rounded-xl overflow-hidden border border-gray-800/50">
        <Table className="shad-table">
          <TableHeader className="bg-gradient-to-r from-dark-200 to-dark-300">
            <TableRow className="shad-table-row-header border-b border-gray-800">
              {columns.map((_, index) => (
                <TableHead key={index} className="py-4">
                  <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[1, 2, 3, 4, 5].map((row) => (
              <TableRow key={row} className="shad-table-row border-b border-gray-800/30">
                {columns.map((_, index) => (
                  <TableCell key={index} className="py-4">
                    <div className="h-4 bg-gray-700 rounded w-full"></div>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="data-table space-y-5 max-w-7xl mx-auto">
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <>
          <div className="relative group rounded-xl overflow-hidden border border-gray-700/50 shadow-2xl bg-gradient-to-br from-gray-900 to-gray-950 hover:border-blue-500/30 transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-2xl blur-2xl group-hover:blur-3xl transition-all duration-300" />
            <div className="relative">
              <Table className="shad-table">
                <TableHeader className="bg-gradient-to-r from-dark-200 to-dark-300">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="shad-table-row-header border-b border-gray-800">
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="text-gray-300 font-semibold uppercase text-xs tracking-wider py-4">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className="shad-table-row border-b border-gray-800/30 hover:bg-dark-300/50 transition-all duration-200 hover:scale-[1.005]"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id} className="py-4 text-gray-200">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center gap-4 py-8">
                          <div className="w-16 h-16 bg-dark-300 rounded-full flex items-center justify-center border border-gray-700/50">
                            <Calendar size={32} className="text-gray-400" />
                          </div>
                          <p className="text-gray-300 text-lg font-semibold">No appointments! Book one now!</p>
                          <Button
                            asChild
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl px-6 py-2.5 font-medium shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                          >
                            <Link href="/patients/new-appointment" aria-label="Book a new appointment">
                              Book Appointment
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
            <div className="text-sm text-gray-400 font-medium">
              Page <span className="text-white font-semibold">{table.getState().pagination.pageIndex + 1}</span>
              {" "}<span className="text-gray-500">of</span>{" "}
              <span className="text-white font-semibold">{table.getPageCount()}</span>
            </div>

            {/* Rows per page selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400 font-medium">Rows per page:</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="bg-dark-400 border border-gray-700/50 text-white rounded-xl px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:bg-dark-500 cursor-pointer"
                aria-label="Select rows per page"
              >
                {[5, 10, 15, 20].map((size) => (
                  <option key={size} value={size} className="bg-dark-400 text-white">
                    {size}
                  </option>
                ))}
              </select>
            </div>

            <div className="table-actions flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="bg-dark-400 border border-gray-700/50 text-white hover:bg-dark-500 hover:border-blue-500/30 transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                aria-label="Previous page"
              >
                <ChevronLeft size={20} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="bg-dark-400 border border-gray-700/50 text-white hover:bg-dark-500 hover:border-blue-500/30 transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
                aria-label="Next page"
              >
                <ChevronRight size={20} />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}