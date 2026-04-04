import React, { useEffect, useState, useMemo } from "react";
import superadminApi from "../../api/superadminApi";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import {
  Plus,
  CheckCircle,
  Ban,
  Trash2,
  Search,
  ArrowUpDown,
  SlidersHorizontal,
  BrushCleaning,
  Check,
  MoveLeft,
  MoveRight,
  FilePenLine,
} from "lucide-react";
import { format } from "date-fns";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type ColumnDef,
  flexRender,
  type SortingState,
  type VisibilityState,
  type ColumnFiltersState,
  type PaginationState,
} from "@tanstack/react-table";

// UI Components
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverPortal,
  PopoverTrigger,
  PopoverClose,
} from "@radix-ui/react-popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import CreateTenantModal from "@/components/superadmin/tenants/CreateTenantModal";
import EditTenantModal from "@/components/superadmin/tenants/EditTenantModal";
import TenantQuickViewDrawer from "@/components/superadmin/tenants/TenantQuickViewDrawer";

// --- Interfaces ---
interface TenantStats {
  _id: string;
  companyName: string;
  logoUrl?: string;
  status: "active" | "inactive" | "suspended" | "pending";
  planName: string;
  billingCycle?: string;
  createdAt?: string;
  customerCount: number;
  leadCount: number;
  adminName?: string;
  adminEmail?: string;
  recentActivity: boolean;
  subscriptionEnd?: string;
}

interface Plan {
  _id: string;
  name: string;
  maxUsers: number;
  modules: string[];
  billingCycle: { tenure: string; price: number }[];
}

const MIN_COLUMNS = 4;
const MAX_COLUMNS = 6;

const SuperAdminTenants = () => {
  const navigate = useNavigate();
  // --- Data State ---
  const [tenants, setTenants] = useState<TenantStats[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);

  // --- Table State ---
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [debouncedGlobalFilter, setDebouncedGlobalFilter] = useState("");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => {
      const saved = localStorage.getItem("superadmin-tenant-columns");
      return saved
        ? JSON.parse(saved)
        : {
            companyName: true,
            planName: true,
            status: true,
            subscriptionEnd: true,
            adminName: false,
            createdAt: false,
          };
    }
  );

  useEffect(() => {
    localStorage.setItem(
      "superadmin-tenant-columns",
      JSON.stringify(columnVisibility)
    );
  }, [columnVisibility]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedGlobalFilter(globalFilter);
    }, 500);
    return () => clearTimeout(timeout);
  }, [globalFilter]);

  // Reset page to 0 when filters change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [debouncedGlobalFilter, columnFilters]);

  // Modal State
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tenantToEdit, setTenantToEdit] = useState<any>(null);
  const [selectedTenant, setSelectedTenant] = useState<TenantStats | null>(
    null
  );

  const fetchData = async () => {
    setLoading(true);
    try {
      const statusFilterValue = columnFilters.find((f) => f.id === "status")
        ?.value as string;

      const params = {
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: debouncedGlobalFilter,
        sortBy: sorting.length > 0 ? sorting[0].id : "createdAt",
        sortOrder:
          sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "desc",
        status: statusFilterValue || "all",
      };

      const [statsRes, plansRes] = await Promise.all([
        superadminApi.get("/superadmin/tenants-list", { params }),
        superadminApi.get("/superadmin/subscription-plans"),
      ]);

      if (statsRes.data && statsRes.data.data) {
        setTenants(statsRes.data.data);
        setTotalPages(statsRes.data.totalPages);
      } else {
        setTenants([]);
      }
      setPlans(plansRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    debouncedGlobalFilter,
    columnFilters,
  ]);

  // --- Handlers ---

  const handleStatusChange = async (tenantId: string, action: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to ${action.replace("_", " ")} this tenant?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, proceed!",
    });

    if (!result.isConfirmed) return;

    try {
      await superadminApi.put(`/superadmin/tenants/${tenantId}/status`, {
        action,
      });
      toast.success(`Tenant status updated`);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const handleDeleteTenant = async (tenantId: string) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will remove all their data permanently. You cannot undo this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    try {
      await superadminApi.delete(`/superadmin/tenants/${tenantId}`);
      toast.success("Tenant deleted successfully");
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete tenant");
    }
  };

  const handleEditClick = async (tenantId: string) => {
    try {
      const res = await superadminApi.get(`/superadmin/tenants/${tenantId}`);
      setTenantToEdit(res.data.tenant);
      setIsEditModalOpen(true);
    } catch (error) {
      toast.error("Failed to fetch tenant details");
    }
  };

  const resetToDefaultColumns = () => {
    setColumnVisibility({
      companyName: true,
      planName: true,
      status: true,
      subscriptionEnd: true,
      adminName: false,
      createdAt: false,
    });
    toast.success("Reset to default columns");
  };

  const resetFilters = () => {
    setGlobalFilter("");
    setColumnFilters([]);
    setSorting([]);
    toast.success("Filters reset");
  };

  // --- Table Configuration ---
  const columns = useMemo<ColumnDef<TenantStats>[]>(
    () => [
      {
        id: "serialNumber",
        header: () => <div className="text-center">Sr No.</div>,
        cell: ({ row, table }) => (
          <div className="text-center text-gray-500 font-medium">
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              row.index +
              1}
          </div>
        ),
        enableHiding: false,
        enableSorting: false,
        size: 60,
      },
      {
        accessorKey: "companyName",
        header: ({ column }) => {
          return (
            <button
              className="flex items-center gap-1 hover:text-indigo-600 font-semibold cursor-pointer"
              onClick={() =>
                column.toggleSorting(column.getIsSorted() === "asc")
              }
            >
              Company
              <ArrowUpDown size={13} />
            </button>
          );
        },
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-gray-200">
              <AvatarImage
                src={row.original.logoUrl}
                alt={row.getValue("companyName")}
              />
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-bold">
                {(row.getValue("companyName") as string)
                  ?.substring(0, 2)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-slate-700 font-medium">
              {row.getValue("companyName")}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "adminName",
        id: "adminName",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-indigo-600 font-semibold cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Owner <ArrowUpDown size={13} />
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-700">
              {row.original.adminName || "N/A"}
            </span>
            <span className="text-xs text-slate-500">
              {row.original.adminEmail || "N/A"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-indigo-600 font-semibold mx-auto cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Joined On <ArrowUpDown size={13} />
          </button>
        ),
        cell: ({ row }) => {
          const date = row.getValue("createdAt") as string;
          return (
            <div className="text-center text-sm text-slate-600">
              {date ? format(new Date(date), "d MMM yyyy") : "—"}
            </div>
          );
        },
      },
      {
        accessorKey: "subscriptionEnd",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-indigo-600 font-semibold mx-auto cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Sub. End <ArrowUpDown size={13} />
          </button>
        ),
        cell: ({ row }) => {
          const date = row.getValue("subscriptionEnd") as string;
          return (
            <div className="text-center text-sm text-slate-600">
              {date ? format(new Date(date), "d MMM yyyy") : "—"}
            </div>
          );
        },
      },
      {
        accessorKey: "planName",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-indigo-600 font-semibold cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Plan
            <ArrowUpDown size={13} />
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="text-slate-700 text-sm font-medium">
              {row.getValue("planName")}
            </span>
            <span className="text-[10px] text-slate-500 capitalize">
              {row.original.billingCycle || "Monthly"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-indigo-600 font-semibold mx-auto cursor-pointer"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status <ArrowUpDown size={13} />
          </button>
        ),
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <div className="text-center">
              <Badge
                variant="outline"
                className={`capitalize ${
                  status === "active"
                    ? "bg-green-50 text-green-700 border-green-200"
                    : status === "pending"
                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                {status}
              </Badge>
            </div>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-center">Actions</div>,
        cell: ({ row }) => {
          const tenant = row.original;
          return (
            <div className="flex justify-center gap-2">
              <TooltipProvider>
                {tenant.status !== "active" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(tenant._id, "activate");
                        }}
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      Activate Tenant
                    </TooltipContent>
                  </Tooltip>
                )}

                {tenant.status === "active" && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStatusChange(tenant._id, "cancel_subscription");
                        }}
                      >
                        <Ban className="h-4 w-4 text-amber-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      Suspend Tenant
                    </TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTenant(tenant._id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    Delete Tenant
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClick(tenant._id);
                      }}
                    >
                      <FilePenLine className="h-3.5 w-3.5 text-blue-600" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    Edit Details
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        },
        enableHiding: false,
        enableSorting: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: tenants,
    columns,
    pageCount: totalPages,
    state: {
      sorting,
      globalFilter,
      columnFilters,
      columnVisibility,
      pagination,
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const handleColumnToggle = (columnId: string) => {
    const column = table.getColumn(columnId);
    if (!column) return;

    const isVisible = column.getIsVisible();
    const currentVisibleCount = table
      .getVisibleLeafColumns()
      .filter((c) => c.getCanHide()).length;

    if (isVisible && currentVisibleCount <= MIN_COLUMNS) {
      toast.warning(`At least ${MIN_COLUMNS} columns must be visible!`);
      return;
    }
    if (!isVisible && currentVisibleCount >= MAX_COLUMNS) {
      toast.warning(`Maximum ${MAX_COLUMNS} columns can be visible!`);
      return;
    }
    column.toggleVisibility(!isVisible);
  };

  return (
    <div className="p-4 bg-white min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tenant Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all registered companies and their subscriptions.
          </p>
        </div>
        <Button
          onClick={() => setIsTenantModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Plus size={16} className="mr-2" /> Create New Tenant
        </Button>
      </div>

      {/* Filters Section */}
      <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3.5 items-start sm:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search company, owner, email..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pl-10 border-gray-300 text-xs bg-white"
            />
          </div>

          {/* Right Side Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full sm:w-auto">
            {/* Status Filter */}
            <Select
              value={
                (table.getColumn("status")?.getFilterValue() as string) ?? "all"
              }
              onValueChange={(value) =>
                table
                  .getColumn("status")
                  ?.setFilterValue(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="w-full sm:w-40 text-xs border-gray-300 bg-white cursor-pointer">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="whitespace-nowrap border-gray-300 text-xs bg-white"
                  >
                    <BrushCleaning className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Clear Filters
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Column Visibility */}
            <Popover>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="border-gray-300 text-xs bg-white"
                      >
                        <SlidersHorizontal className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    Toggle Columns
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <PopoverPortal>
                <PopoverContent
                  side="bottom"
                  align="end"
                  sideOffset={4}
                  avoidCollisions
                  collisionPadding={10}
                  className="w-60 bg-white shadow-xl border rounded-xl z-9999 flex flex-col"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  {/* Count only toggleable columns */}
                  <div className="text-xs font-semibold border-b px-3 py-2 text-gray-500">
                    Visible Columns (
                    {
                      table
                        .getVisibleLeafColumns()
                        .filter((c) => c.getCanHide()).length
                    }
                    /{MAX_COLUMNS})
                  </div>
                  <div className="max-h-65 overflow-y-auto px-1">
                    {table
                      .getAllLeafColumns()
                      .filter((column) => column.getCanHide())
                      .map((column) => (
                        <div
                          key={column.id}
                          onClick={() => handleColumnToggle(column.id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-sm cursor-pointer hover:bg-gray-100 text-sm capitalize ${
                            column.getIsVisible()
                              ? "text-blue-700"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <span className="text-sm capitalize">
                            {column.id.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                          {column.getIsVisible() && (
                            <Check className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                      ))}
                  </div>
                  <div className="border-t p-2">
                    <PopoverClose asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={resetToDefaultColumns}
                      >
                        Reset to Default
                      </Button>
                    </PopoverClose>
                  </div>
                </PopoverContent>
              </PopoverPortal>
            </Popover>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="text-sm font-semibold text-gray-600 h-10"
                    >
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
                // Loading Skeletons
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 w-full bg-gray-200 rounded-md animate-pulse" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row, _index) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={(e) => {
                      // Prevent navigation if clicking on interactive elements (buttons/links)
                      if (
                        (e.target as HTMLElement).closest("button") ||
                        (e.target as HTMLElement).closest("a")
                      ) {
                        return;
                      }
                      setSelectedTenant(row.original);
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-3">
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
                  <TableCell colSpan={columns.length} className="h-48">
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl min-h-40 bg-gray-50 text-center">
                      <p className="text-gray-600 font-medium text-lg">
                        No tenants found!
                      </p>
                      <p className="text-gray-400">Adjust your filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        {!loading && totalPages > 0 && (
          <div className="flex flex-col sm:flex-row justify-center items-center p-4 border-t border-gray-200 gap-4">
            <div className="flex items-center justify-center space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="text-xs border-gray-300 h-8 px-3"
              >
                <MoveLeft className="h-3 w-3 mr-1" /> Previous
              </Button>

              <div className="flex items-center space-x-1 mx-2 sm:mx-4">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    const curr = table.getState().pagination.pageIndex + 1;
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - curr) <= 1
                    );
                  })
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="text-xs text-gray-500 px-1">...</span>
                      )}
                      <Button
                        variant={
                          table.getState().pagination.pageIndex + 1 === page
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => table.setPageIndex(page - 1)}
                        className="text-xs h-8 w-8 p-0"
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="text-xs border-gray-300 h-8 px-3"
              >
                Next <MoveRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Tenant Modal */}
      {isTenantModalOpen && (
        <CreateTenantModal
          isOpen={isTenantModalOpen}
          onClose={() => setIsTenantModalOpen(false)}
          onSuccess={fetchData}
          plans={plans}
        />
      )}

      {/* Edit Tenant Modal */}
      {isEditModalOpen && tenantToEdit && (
        <EditTenantModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setTenantToEdit(null);
          }}
          onSuccess={fetchData}
          tenant={tenantToEdit}
          plans={plans}
        />
      )}

      {/* Quick View Drawer */}
      <TenantQuickViewDrawer
        tenant={selectedTenant}
        isOpen={!!selectedTenant}
        onClose={() => setSelectedTenant(null)}
        onNavigate={(id) => navigate(`/superadmin/tenants/${id}`)}
        onEdit={handleEditClick}
      />
    </div>
  );
};

export default SuperAdminTenants;
