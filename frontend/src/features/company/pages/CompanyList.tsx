import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify"; // Keep toast for general messages
import { Company } from "../components/company.types"; // Keep Company type
import CompanyTable from "../components/CompanyTable"; // Import CompanyTable
import { Plus, ChevronsUpDown, FilePenLine } from "lucide-react"; // Keep Plus for the Add Company button
import { Button } from "@/components/ui/button"; // Keep Button for the Add Company button
import { companyApi } from "../components/companyApi";
import {
  ColumnDef,
  getCoreRowModel,
  useReactTable,
  PaginationState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
const CompanyList: React.FC = () => {
  const navigate = useNavigate(); // Keep navigate for page navigation

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(-1);
  const [searchInput, setSearchInput] = useState(""); // State for search input
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    // Default column visibility settings
    serialNumber: true,
    companyId: true,
    name: true,
    email: false, // Changed to false for default
    actions: true,
    phone: false,
    "address.country": false,
    isActive: true, // Changed to true for default
    bankDetails: false, // Add bankDetails to default hidden columns
  });
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all"); // New state for status filter

  // Function to generate pagination numbers with ellipsis
  const generatePagination = useCallback(
    (currentPage: number, totalPages: number) => {
      if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      if (currentPage <= 3) {
        return [1, 2, 3, 4, "...", totalPages];
      }
      if (currentPage >= totalPages - 2) {
        return [
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        ];
      }
      return [
        1,
        "...",
        currentPage - 1,
        currentPage,
        currentPage + 1,
        "...",
        totalPages,
      ];
    },
    []
  );

  const fetchCompanies = useCallback(
    async (
      search: string,
      page: number,
      limit: number,
      sortBy: string,
      sortOrder: "asc" | "desc",
      status: "all" | "active" | "inactive" // Added status parameter
    ) => {
      setLoading(true);
      try {
        const res = await companyApi.getCompanies(
          search,
          page,
          limit,
          sortBy,
          sortOrder,
          status // Pass status to the API call
        );
        setCompanies(res.data || []); // Correctly access the array of companies
        setPageCount(res.totalPages || 1); // Correctly access totalPages
      } catch (error) {
        console.error("Failed to fetch companies:", error);
        toast.error("Failed to fetch companies.");
        setCompanies([]); // Clear companies on error
        setPageCount(1); // Reset page count on error
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const columns = useMemo<ColumnDef<Company>[]>(
    () => [
      {
        id: "serialNumber",
        header: () => <div className="font-bold text-gray-700 pl-4">S.No</div>,
        cell: ({ row }) => (
          <div className="font-medium text-gray-500 pl-4">
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              row.index +
              1}
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "companyId",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-900 font-bold text-gray-700 cursor-pointer"
          >
            Company ID <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.companyId}</span>
        ),
      },
      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-900 font-bold text-gray-700 cursor-pointer"
          >
            Name <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "email",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-900 font-bold text-gray-700 cursor-pointer"
          >
            Email <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-gray-700">{row.original.email || "N/A"}</span>
        ),
      },
      {
        accessorKey: "phone",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-900 font-bold text-gray-700 cursor-pointer"
          >
            Phone <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <span className="text-gray-700">{row.original.phone || "N/A"}</span>
        ),
      },
      {
        accessorKey: "address.country",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-gray-900 font-bold text-gray-700 cursor-pointer"
          >
            Country <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: (
          { row } // Access country through the address object
        ) => (
          <span className="text-gray-700">
            {row.original.address?.country || "N/A"}
          </span>
        ),
      },
      {
        accessorKey: "isActive",
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 justify-center w-full hover:text-gray-900 font-bold text-gray-700 cursor-pointer"
          >
            Status <ChevronsUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                row.original.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {row.original.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        ),
      },
      {
        id: "actions",
        header: () => (
          <div className="text-center font-bold text-gray-700">Actions</div>
        ),
        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 w-10 p-0 cursor-pointer"
                    onClick={() =>
                      navigate(`/companies/edit/${row.original._id}`)
                    }
                  >
                    <FilePenLine className="h-6 w-6 text-blue-600 cursor-pointer" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  Edit Company
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ),
        enableHiding: false, // Actions column should always be visible
      },
    ],
    [navigate]
  );

  useEffect(() => {
    const sortParam = sorting.length > 0 ? sorting[0].id : "createdAt";
    const sortOrder =
      sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : "desc";

    fetchCompanies(
      globalFilter,
      pagination.pageIndex + 1,
      pagination.pageSize,
      sortParam,
      sortOrder,
      statusFilter // Pass statusFilter to fetchCompanies
    );
  }, [
    fetchCompanies,
    globalFilter,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    statusFilter, // Add statusFilter to dependencies
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setGlobalFilter(searchInput);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const table = useReactTable({
    data: companies, // Pass companies data
    columns: columns, // Use the defined columns
    getRowId: (row) => row._id, // Explicitly tell react-table to use _id as row ID
    pageCount: pageCount,
    state: { pagination, sorting, globalFilter, columnVisibility },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  console.log("Companies state:", companies);
  console.log("Table row model rows:", table.getRowModel().rows);

  return (
    <div className="p-4 md:p-6 lg:p-8 mx-auto space-y-4 md:space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          Companies
        </h1>
        {/* Add Company Button - remains in CompanyList as it's a page-level action */}
        <Button
          onClick={() => navigate("/companies/add")}
          className="h-10 px-4 shrink-0 rounded-md shadow-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors flex-1 sm:flex-none cursor-pointer"
        >
          <Plus className="h-4 w-4 sm:mr-2 cursor-pointer" />
          <span className="hidden sm:inline">Add Company</span>
          <span className="sm:hidden">Add</span>
        </Button>
      </div>

      {/* CompanyTable Component - now handles all table UI and interactions */}
      <CompanyTable
        table={table}
        navigate={navigate}
        pageCount={pageCount}
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        setGlobalFilter={setGlobalFilter}
        setSorting={setSorting}
        setPagination={setPagination}
        setColumnVisibility={setColumnVisibility}
        generatePagination={generatePagination}
        loading={loading}
        statusFilter={statusFilter} // Pass statusFilter
        setStatusFilter={setStatusFilter} // Pass setStatusFilter
      />
    </div>
  );
};

export default CompanyList;
