import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useLocation  } from "react-router-dom";
import { toast } from "react-toastify";
import { Company } from "../components/company.types";
import CompanyTable from "../components/CompanyTable";
import { Plus, ChevronsUpDown, FilePenLine, Eye  } from "lucide-react";
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
  const navigate = useNavigate();
  const location = useLocation();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageCount, setPageCount] = useState(-1);

  const [searchInput, setSearchInput] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");

  const [sorting, setSorting] = useState<SortingState>([]);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });

  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>({
      serialNumber: true,
      companyId: true,
      name: true,
      email: false,
      actions: true,
      phone: false,
      "address.country": false,
      isActive: true,
      bankDetails: false,
    });

  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

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
      status: "all" | "active" | "inactive"
    ) => {
      setLoading(true);

      try {
        const res = await companyApi.getCompanies(
          search,
          page,
          limit,
          sortBy,
          sortOrder,
          status
        );

        setCompanies(res.data || []);
        setPageCount(res.totalPages || 1);
      } catch (error) {
        console.error(error);
        toast.error("Failed to fetch companies.");
        setCompanies([]);
        setPageCount(1);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const columns = useMemo<ColumnDef<Company>[]>(
    () => [
      {
        accessorKey: "companyId",
        header: ({ column }) => (
          <button
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="flex items-center gap-1 mx-auto text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700"
          >
            Company ID
            <ChevronsUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-semibold">
              {row.original.companyId}
            </span>
          </div>
        ),
      },

      {
        accessorKey: "name",
        header: ({ column }) => (
          <button
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="flex items-center gap-1 mx-auto text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700"
          >
            Name
            <ChevronsUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-center font-bold text-slate-800">
            {row.original.name}
          </div>
        ),
      },

      {
        accessorKey: "email",
        header: ({ column }) => (
          <button
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="flex items-center gap-1 mx-auto text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700"
          >
            Email
            <ChevronsUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-center text-sm text-slate-600">
            {row.original.email || "-"}
          </div>
        ),
      },

      {
        accessorKey: "phone",
        header: ({ column }) => (
          <button
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="flex items-center gap-1 mx-auto text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700"
          >
            Phone
            <ChevronsUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-center text-sm text-slate-600">
            {row.original.phone || "-"}
          </div>
        ),
      },

      {
        accessorKey: "address.country",
        header: ({ column }) => (
          <button
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="flex items-center gap-1 mx-auto text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700"
          >
            Country
            <ChevronsUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-center text-sm text-slate-600">
            {row.original.address?.country || "-"}
          </div>
        ),
      },

      {
        accessorKey: "isActive",
        header: ({ column }) => (
          <button
            onClick={() =>
              column.toggleSorting(column.getIsSorted() === "asc")
            }
            className="flex items-center gap-1 mx-auto text-[11px] font-bold uppercase tracking-wider text-slate-400 hover:text-slate-700"
          >
            Status
            <ChevronsUpDown className="h-3 w-3" />
          </button>
        ),
        cell: ({ row }) => (
          <div className="text-center">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
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
          <div className="text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Actions
          </div>
        ),

        cell: ({ row }) => (
          <div className="flex justify-center gap-2">
            <TooltipProvider>
              {/* VIEW BUTTON */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/companies/${row.original._id}`);
                    }}
                    className="cursor-pointer p-2.5 text-slate-500 border border-slate-200 rounded-xl bg-white hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                  >
                    <Eye size={18} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>View Details</TooltipContent>
              </Tooltip>
        
              {/* EDIT BUTTON */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/companies/edit/${row.original._id}`);
                    }}
                    className="cursor-pointer p-2.5 text-blue-600 border border-slate-200 rounded-xl bg-white hover:text-blue-700 hover:border-blue-300 hover:bg-blue-50 hover:scale-110 hover:shadow-sm transition-all duration-200 active:scale-95"
                  >
                    <FilePenLine size={18} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Edit Company</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ),

        enableHiding: false,
      },
    ],
    [navigate]
  );

  useEffect(() => {
    const sortParam = sorting.length > 0 ? sorting[0].id : "createdAt";

    const sortOrder =
      sorting.length > 0
        ? sorting[0].desc
          ? "desc"
          : "asc"
        : "desc";

    fetchCompanies(
      globalFilter,
      pagination.pageIndex + 1,
      pagination.pageSize,
      sortParam,
      sortOrder,
      statusFilter
    );
  }, [
    fetchCompanies,
    globalFilter,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    statusFilter,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setGlobalFilter(searchInput);
      setPagination((prev) => ({
        ...prev,
        pageIndex: 0,
      }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const table = useReactTable({
    data: companies,
    columns,
    pageCount,
    getRowId: (row) => row._id,
    state: {
      pagination,
      sorting,
      globalFilter,
      columnVisibility,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  useEffect(() => {
  const message = sessionStorage.getItem("companySuccessMessage");

  if (message) {
    toast.success(message);
    sessionStorage.removeItem("companySuccessMessage");
  }
}, []);

  return (
    <div>
      <div className="bg-white rounded-[20px] shadow-sm border border-slate-200 overflow-hidden">
        {/* HEADER */}
        <div className="px-8 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-[#0f172a]">
              Companies
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Manage all registered companies
            </p>
          </div>

          <button
            onClick={() => navigate("/companies/add")}
            className="cursor-pointer flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5c67ff] to-[#3a47ff] hover:brightness-110 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-200 transition-all active:scale-95"
          >
            <Plus size={18} strokeWidth={3} />
            Add Company
          </button>
        </div>

        {/* TABLE */}
        <div className="p-0">
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
            piLoading={loading}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />
        </div>
      </div>
    </div>
  );
};

export default CompanyList;