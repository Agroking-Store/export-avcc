import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { apiConfig } from "../../../config/apiConfig";
import {
  Eye,
  Pencil,
  Trash2,
  Search,
  Filter,
  FilePlus,
  ArrowUpDown,
} from "lucide-react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  PaginationState,
  SortingState,
  ColumnDef,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PIList = () => {
  const navigate = useNavigate();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Table Server-Side States
  const [pageCount, setPageCount] = useState(-1);
  const [searchInput, setSearchInput] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  // Debounce search input to avoid slamming the API
  useEffect(() => {
    const timer = setTimeout(() => {
      setGlobalFilter(searchInput);
      setPagination((prev) => ({ ...prev, pageIndex: 0 })); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchPIs = async () => {
    try {
      setLoading(true);
      const sortParam = sorting.length > 0 ? sorting[0].id : undefined;
      const sortOrder =
        sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : undefined;

      const res = await axios.get(`${apiConfig.baseURL}/proforma-invoices`, {
        params: {
          search: globalFilter,
          page: pagination.pageIndex + 1, // API usually expects 1-indexed pages
          limit: pagination.pageSize,
          sortBy: sortParam,
          sortOrder: sortOrder,
        },
      });

      setData(res.data.data);
      setPageCount(res.data.totalPages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPIs();
  }, [pagination.pageIndex, pagination.pageSize, sorting, globalFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-700";
      case "pending_approval":
        return "bg-yellow-100 text-yellow-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "sent_to_buyer":
        return "bg-blue-100 text-blue-700";
      case "lc_received":
        return "bg-purple-100 text-purple-700";
      case "expired":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100";
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: "piNumber",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-slate-800"
          >
            PI No <ArrowUpDown size={14} />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.piNumber}</span>
        ),
      },
      {
        accessorKey: "client_id.name",
        id: "client",
        header: "Client",
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.client_id?.name}</div>
            <div className="text-xs text-gray-500">
              {row.original.client_id?.clientCode}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "totalAmount",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 justify-center w-full hover:text-slate-800"
          >
            Amount <ArrowUpDown size={14} />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-center font-semibold text-slate-700">
            ${row.original.totalAmount}
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: () => <div className="text-center">Status</div>,
        cell: ({ row }) => (
          <div className="text-center">
            <span
              className={`px-2 py-1 text-xs rounded ${getStatusColor(
                row.original.status
              )}`}
            >
              {row.original.status}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "validityDate",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 justify-center w-full hover:text-slate-800"
          >
            Date <ArrowUpDown size={14} />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            {row.original.validityDate
              ? new Date(row.original.validityDate).toISOString().split("T")[0]
              : "-"}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            <button
              onClick={() => navigate(`/proforma-invoice/${row.original._id}`)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            >
              <Eye size={18} />
            </button>
            <button
              onClick={() =>
                navigate(`/proforma-invoice/edit/${row.original._id}`)
              }
              className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => handleDelete(row.original._id)}
              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this PI?")) return;

    try {
      await axios.delete(`${apiConfig.baseURL}/proforma-invoices/${id}`);
      fetchPIs();
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">
            Proforma Invoices
          </h2>
          <p className="text-sm text-slate-500">Manage all proforma invoices</p>
        </div>

        <button
          onClick={() => navigate("/proforma-invoice/add")}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <FilePlus size={18} />
          Create PI
        </button>
      </div>

      {/* CARD */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* TOOLBAR */}
        <div className="px-6 py-4 border-b bg-slate-50 flex flex-wrap gap-4 justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search PI..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none w-64"
              />
            </div>

            {/* ITEMS PER PAGE */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Show</span>
              <select
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                className="border border-slate-300 rounded-md px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {[5, 10, 25, 50].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize}
                  </option>
                ))}
              </select>
              <span className="text-sm text-slate-500">entries</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-md">
            <Filter size={16} />
            Filter: All PIs
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 text-slate-500 text-xs uppercase">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="py-3 px-6">
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
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-slate-500"
                  >
                    Loading data...
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-6 py-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-slate-500"
                  >
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION */}
        <div className="flex justify-between items-center px-6 py-4 border-t bg-slate-50">
          <span className="text-sm text-slate-500">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </span>

          <div className="flex gap-2">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-4 py-2 border border-slate-300 rounded-md text-sm font-medium hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PIList;
